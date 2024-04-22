import type { PDFSimilarityData } from '~/types/pdf';

import pg from 'pg';
import pgvector from 'pgvector/pg';

const { Pool } = pg;
export class DB {
  #pool;

  constructor() {
    this.#pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    this.#pool.on('connect', async (client) => {
      await pgvector.registerType(client);
    });
  }

  /**
   * Executes a query on the database.
   *
   * @param {string} queryString - The SQL query string to execute.
   * @param {any[]} [values=[]] - The values to bind to the query string.
   * @returns {Promise<QueryResult>} A promise that resolves to the result of the query.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query(queryString: string, values: any[] = []) {
    return this.#pool.query(queryString, values);
  }

  /**
   * Performs a similarity search on the 'pdf_embeddings' table using the provided vector.
   *
   * @param {number[]} vector - The vector to compare with the vectors in the 'pdf_embeddings' table.
   * @param {number} [limit=10] - The maximum number of results to return.
   * @returns {Promise<PDFSimilarityData[]>} A promise that resolves to an array of objects, each containing the 'id', 'content', 'metadata', and 'distance' of a row in the 'pdf_embeddings' table.
   */
  async similaritySearch(
    vector: number[],
    limit = 10
  ): Promise<PDFSimilarityData[]> {
    const query = `
        SELECT 
          id, content, metadata, vector <=> $1 AS distance 
        FROM pdf_embeddings 
        ORDER BY distance ASC LIMIT $2
      `;
    const { rows } = await this.query(query, [pgvector.toSql(vector), limit]);
    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      distance: row.distance,
    }));
  }

  /**
   * Inserts a new PDF document into the 'pdf_documents' table.
   *
   * @param {string} filename - The filename of the PDF document.
   * @param {string} url - The URL where the PDF document is located.
   * @returns {Promise<number>} A promise that resolves to the ID of the inserted row, or undefined if a row with the same filename already exists.
   */
  async insertPDF(filename: string, url: string) {
    const exists = await this.pdfExists(filename);

    if (exists) return;

    const query = `
      INSERT INTO pdf_documents (filename, url)
      VALUES ($1, $2)
      RETURNING id
    `;

    const { rows } = await this.query(query, [filename, url]);
    return rows[0].id;
  }

  /**
   * Checks if a PDF document with the given filename exists in the 'pdf_documents' table.
   *
   * @param {string} filename - The filename of the PDF document.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether a PDF document with the given filename exists.
   */
  async pdfExists(filename: string) {
    const query = `
      SELECT id FROM pdf_documents WHERE filename = $1
    `;

    const { rows } = await this.query(query, [filename]);
    return rows.length > 0;
  }

  /**
   * Retrieves all PDF documents from the 'pdf_documents' table.
   *
   * @returns {Promise<{name: string, url: string}[]>} A promise that resolves to an array of objects, each containing the 'name' and 'url' of a PDF document.
   */
  async listPDFs() {
    const { rows } = await this.query('SELECT * FROM pdf_documents');
    return rows.map((row) => ({
      name: row.filename,
      url: row.url,
    }));
  }
}
