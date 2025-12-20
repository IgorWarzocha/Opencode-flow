import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

/**
 * Code Embeddings - Transformers.js integration
 * Generates vector representations of code for semantic discovery.
 */

class EmbeddingModel {
  private static instance: FeatureExtractionPipeline | null = null;
  private static modelName = "Xenova/all-MiniLM-L6-v2";

  static async getInstance(): Promise<FeatureExtractionPipeline> {
    if (!this.instance) {
      this.instance = await pipeline("feature-extraction", this.modelName);
    }
    return this.instance;
  }
}

export const getEmbeddingModel = async () => {
  try {
    return await EmbeddingModel.getInstance();
  } catch (error) {
    console.error("Failed to load embedding model:", error);
    throw new Error("Failed to initialize AI embedding model");
  }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  try {
    const extractor = await getEmbeddingModel();
    // pooling: 'mean' and normalize: true are standard for sentence embeddings
    const output = await extractor(text, { pooling: "mean", normalize: true });

    // The output is a Tensor, convert Float32Array to standard number[]
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
