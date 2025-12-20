import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

/**
 * Code Embeddings - Transformers.js integration
 * Generates vector representations of code for semantic discovery.
 */

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class EmbeddingModel {
  private static instance: FeatureExtractionPipeline | null = null;
  private static modelName = "Xenova/all-MiniLM-L6-v2";

  static async getInstance(): Promise<FeatureExtractionPipeline> {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (!this.instance) {
      this.instance = await pipeline("feature-extraction", this.modelName);
    }
    return this.instance;
  }
}

export const getEmbeddingModel = async () => {
  try {
    return await EmbeddingModel.getInstance();
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Don't console.error here to avoid cluttering logs during expected failures if any
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array.from(output.data);
  } catch (error) {
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};