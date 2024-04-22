import type { ChainValues } from 'langchain/schema';

import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PromptTemplate } from '@langchain/core/prompts';
import { RetrievalQAChain, loadQAStuffChain } from 'langchain/chains';
import { PDFUtils } from '~/src/pdf';

type FilterParams = {
  filename: string;
};

type AIOptions = {
  pgVectorStore: PGVectorStore;
  chain: RetrievalQAChain;
  filter?: FilterParams;
};

export class AI {
  #pgVectorStore: PGVectorStore;
  #chain: RetrievalQAChain;

  /**
   * Creates a new instance of the AI class.
   *
   * @param {AIOptions} options - The options to use when creating the AI instance.
   * @param {PGVectorStore} options.pgVectorStore - The PGVectorStore instance to use for storing vectors.
   * @param {Chain} options.chain - The Chain instance to use for sending questions to the AI.
   */
  constructor({ pgVectorStore, chain }: AIOptions) {
    this.#pgVectorStore = pgVectorStore;
    this.#chain = chain;
  }

  /**
   * Builds an AI instance with the specified filter parameters.
   *
   * @param {FilterParams} [filter] - The filter parameters to use when building the AI instance.
   * @returns {Promise<AI>} A promise that resolves to the built AI instance.
   */
  static getEmbeddings(text: string) {
    const embeddings = new OpenAIEmbeddings();
    return embeddings.embedQuery(text);
  }

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
      new OpenAIEmbeddings(),
      pgOptions
    );

    const promptTemplate = new PromptTemplate({
      inputVariables: ['context', 'question'],
      template: `You are given a context from a PDF file and a question. Try to answer the question based on the provided context. 
      
      If you don't know the answer, say. "Sorry, I don't know the answer". 
      
      The provided context is:
      ------
      {context}
      ------

      And the question: {question}
      Answer:
      `,
    });

    const retriever = pgVectorStore.asRetriever(8, {
      source: filter?.filename,
    });

    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0125',
    });

    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(model, {
        prompt: promptTemplate,
      }),
      retriever,
      returnSourceDocuments: false,
      inputKey: 'question',
      verbose: true,
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
   * @returns {Promise<ChainValues>} A promise that resolves to the response from the AI.
   */
  async query(question: string): Promise<ChainValues> {
    return this.#chain.invoke({ question });
  }
}
