import { getDB } from "./sqlite.ts";

// Helper to serialize the vector for sqlite-vec since the export was missing
const serializeFloat32Array = (vector: Float32Array): Uint8Array => {
  return new Uint8Array(vector.buffer);
};

export interface CodeEmbedding {
  id: string;
  file_path: string;
  content: string;
  distance?: number;
}

/**
 * Inserts a code embedding into the database.
 * This handles both the metadata storage in code_embeddings and the vector index in code_vectors.
 */
export const insertEmbedding = (
  id: string,
  filePath: string,
  content: string,
  vector: number[],
) => {
  const vectorFloat32 = new Float32Array(vector);
  const serializedVector = serializeFloat32Array(vectorFloat32);

  const insertTx = getDB().transaction(() => {
    // 1. Insert into code_embeddings
    // We store the binary embedding in the main table too, just in case, although strictly redundant.
    getDB()
      .prepare(
        `INSERT INTO code_embeddings (id, file_path, content, embedding) VALUES (?, ?, ?, ?)`,
      )
      .run(id, filePath, content, serializedVector);

    // 2. Get the rowid of the inserted record
    // last_insert_rowid() works within the same connection
    const rowIdResult = getDB().prepare("SELECT last_insert_rowid() as rowid").get() as {
      rowid: number | bigint;
    };
    const rowId = rowIdResult.rowid;

    // 3. Insert into code_vectors virtual table using the same rowid
    getDB()
      .prepare(`INSERT INTO code_vectors(rowid, embedding) VALUES (?, ?)`)
      .run(rowId, serializedVector);
  });

  insertTx();
};

/**
 * Searches for similar code vectors using L2 distance.
 */
export const searchVectors = (vector: number[], limit = 10): CodeEmbedding[] => {
  const vectorFloat32 = new Float32Array(vector);
  const serializedVector = serializeFloat32Array(vectorFloat32);

  // We query code_vectors for nearest neighbors and join with code_embeddings to get metadata.
  // We match on rowid.
  const query = getDB().prepare(`
    SELECT
      e.id,
      e.file_path,
      e.content,
      v.distance
    FROM code_vectors v
    JOIN code_embeddings e ON v.rowid = e.rowid
    WHERE v.embedding MATCH ?
    AND k = ?
    ORDER BY v.distance
  `);

  // Note: sqlite-vec usage for KNN:
  // WHERE embedding MATCH $vector AND k = $k
  const results = query.all(serializedVector, limit) as CodeEmbedding[];

  return results;
};
