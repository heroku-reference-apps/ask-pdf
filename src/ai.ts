import { HerokuMiaEmbeddings, HerokuMia } from 'heroku-langchain';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PromptTemplate } from '@langchain/core/prompts';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { PDFUtils } from '~/src/pdf';
import { Runnable } from '@langchain/core/runnables';

type FilterParams = {
  filename: string;
};

type AIOptions = {
  pgVectorStore: PGVectorStore;
  chain: Runnable;
  filter?: FilterParams;
};

export class AI {
  #pgVectorStore: PGVectorStore;
  #chain: Runnable;

  /**
   * Creates a new instance of the AI class.
   *
   * @param {AIOptions} options - The options to use when creating the AI instance.
   * @param {PGVectorStore} options.pgVectorStore - The PGVectorStore instance to use for storing vectors.
   * @param {Runnable} options.chain - The Chain instance to use for sending questions to the AI.
   */
  constructor({ pgVectorStore, chain }: AIOptions) {
    this.#pgVectorStore = pgVectorStore;
    this.#chain = chain;
  }

  static getEmbeddings(text: string) {
    const embeddings = new HerokuMiaEmbeddings();
    return embeddings.embedQuery(text);
  }
  
  /**
   * Builds an AI instance with the specified filter parameters.
   *
   * @param {FilterParams} [filter] - The filter parameters to use when building the AI instance.
   * @returns {Promise<AI>} A promise that resolves to the built AI instance.
   */
  static async build(filter?: FilterParams) {
    const pgOptions = {
      postgresConnectionOptions: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      },
      tableName: 'pdf_embeddings',
      columns: {
        idColumnName: 'id',
        vectorColumnName: 'vector',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
      },
    };

    const pgVectorStore = await PGVectorStore.initialize(
      new HerokuMiaEmbeddings(),
      pgOptions
    );

    const promptTemplate =
      PromptTemplate.fromTemplate(`You are an AI assistant helping users understand content from PDF documents. Your task is to provide accurate, concise answers based solely on the provided context.

      Guidelines:
      - Answer using only information from the provided context
      - Be direct and concise in your responses
      - If the context doesn't contain enough information to answer, respond with "I cannot answer this question based on the provided context"
      - If the question is unclear, ask for clarification
      - Maintain a professional and helpful tone
      
      Context from PDF:
      ------
      {context}
      ------

      Question: {input}

      Answer:
      `);

    const retriever = pgVectorStore.asRetriever({
      k: 8,
      filter: filter?.filename
        ? { source: { $like: `%${filter.filename}%` } }
        : undefined,
    });

    const model = new HerokuMia();

    // Create the document combination chain
    const combineDocsChain = await createStuffDocumentsChain({
      llm: model,
      prompt: promptTemplate,
    });

    // Create the retrieval chain
    const chain = await createRetrievalChain({
      retriever,
      combineDocsChain,
    });

    return new AI({ pgVectorStore, chain, filter });
  }

  /**
   * Vectorizes a PDF document and stores the vectors in the database.
   *
   * @param {string} filename - The filename of the PDF document to vectorize.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async vectorizePDF(filename: string) {
    const docs = await PDFUtils.loadPDF(filename);

    if (!docs || docs.length === 0) {
      console.log('No documents found to vectorize.');
      return;
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 0,
    });

    const chunks = await splitter.splitDocuments(docs);
    await this.#pgVectorStore.addDocuments(chunks);
  }

  /**
   * Sends a question to the AI and returns the response.
   *
   * @param {string} question - The question to ask the AI.
   * @returns {Promise<string>} A promise that resolves to the response from the AI.
   */
  async query(question: string): Promise<string> {
    return this.#chain.invoke({ input: question });
  }
}
