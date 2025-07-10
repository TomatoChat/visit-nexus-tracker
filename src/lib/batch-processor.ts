interface BatchProcessorOptions<T> {
  batchSize: number;
  delay?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (results: T[]) => void;
  onError?: (error: Error) => void;
}

export class BatchProcessor<T, R> {
  private options: BatchProcessorOptions<R>;
  private queue: T[] = [];
  private processing = false;
  private results: R[] = [];

  constructor(options: BatchProcessorOptions<R>) {
    this.options = options;
  }

  add(item: T) {
    this.queue.push(item);
  }

  addBatch(items: T[]) {
    this.queue.push(...items);
  }

  async process(processor: (item: T) => Promise<R>): Promise<R[]> {
    if (this.processing) {
      throw new Error('Already processing');
    }

    this.processing = true;
    this.results = [];

    try {
      const totalItems = this.queue.length;
      let processedItems = 0;

      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.options.batchSize);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (item) => {
            try {
              return await processor(item);
            } catch (error) {
              console.error('Error processing item:', error);
              throw error;
            }
          })
        );

        this.results.push(...batchResults);
        processedItems += batch.length;

        // Update progress
        const progress = (processedItems / totalItems) * 100;
        this.options.onProgress?.(progress);

        // Add delay between batches if specified
        if (this.options.delay && this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.delay));
        }
      }

      this.options.onComplete?.(this.results);
      return this.results;
    } catch (error) {
      this.options.onError?.(error as Error);
      throw error;
    } finally {
      this.processing = false;
    }
  }

  clear() {
    this.queue = [];
    this.results = [];
  }

  get isProcessing() {
    return this.processing;
  }

  get queueLength() {
    return this.queue.length;
  }
}

// Utility function for processing photos in batches
export async function processPhotosInBatches(
  photos: File[],
  processor: (photo: File) => Promise<string>,
  options: {
    batchSize?: number;
    delay?: number;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<string[]> {
  const batchProcessor = new BatchProcessor<File, string>({
    batchSize: options.batchSize || 3,
    delay: options.delay || 100,
    onProgress: options.onProgress,
  });

  batchProcessor.addBatch(photos);
  return await batchProcessor.process(processor);
} 