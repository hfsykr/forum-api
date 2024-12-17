/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123', content = 'Comment content', date = new Date(), thread, owner,
  }) {
    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5)',
      values: [id, content, date, thread, owner],
    };

    await pool.query(query);
  },

  async findCommentsById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findDeletedCommentsById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1 AND is_delete IS TRUE',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async addCommentLike({ id, comment, owner }) {
    const query = {
      text: 'INSERT INTO comments_likes VALUES($1, $2, $3)',
      values: [id, comment, owner],
    };

    await pool.query(query);
  },

  async findCommentsLikes(comment, owner) {
    const query = {
      text: 'SELECT id FROM comments_likes WHERE comment = $1 AND owner = $2',
      values: [comment, owner],
    };

    const result = await pool.query(query);

    return result.rows;
  },

  async getCommentsLikeCountById(id) {
    const query = {
      text: 'SELECT like_count FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);

    return result.rows[0].like_count;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = CommentsTableTestHelper;
