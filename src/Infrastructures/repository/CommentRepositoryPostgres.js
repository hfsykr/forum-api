const AddedComment = require('../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const ForbiddenError = require('../../Commons/exceptions/ForbiddenError');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(threadId, userId, newComment) {
    const { content } = newComment;
    const id = `comment-${this._idGenerator()}`;
    const date = new Date();

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner',
      values: [id, content, date, threadId, userId],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async verifyCommentExistsById(id) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('comment tidak ditemukan');
    }
  }

  async verifyOwnerByUserId(id, userId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND owner = $2',
      values: [id, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new ForbiddenError('tidak memiliki hak untuk mengakses comment');
    }
  }

  async deleteCommentById(id) {
    const query = {
      text: 'UPDATE comments SET is_delete = TRUE WHERE id = $1',
      values: [id],
    };

    await this._pool.query(query);
  }

  async getAllCommentByThreadId(threadId) {
    const query = {
      text: `SELECT comments.*, users.username
        FROM comments
        INNER JOIN users ON users.id = comments.owner
        WHERE thread = $1 
        ORDER BY date ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async verifyUserHasLikeComment(id, userId) {
    const query = {
      text: 'SELECT id FROM comments_likes WHERE comment = $1 AND owner = $2',
      values: [id, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      return false;
    };

    return true;
  }

  async addCommentLike(commentId, userId) {
    const id = `comment_like-${this._idGenerator()}`;
    const query = {
      text: 'INSERT INTO comments_likes VALUES($1, $2, $3)',
      values: [id, commentId, userId],
    };

    await this._pool.query(query);
  }

  async deleteCommentLike(commentId, userId) {
    const query = {
      text: 'DELETE FROM comments_likes WHERE comment = $1 AND owner = $2',
      values: [commentId, userId],
    };

    await this._pool.query(query);
  }

  async increaseLikeCountByCommentId(id) {
    const query = {
      text: 'UPDATE comments SET like_count = like_count + 1 WHERE id = $1',
      values: [id],
    };

    await this._pool.query(query);
  }

  async decreaseLikeCountByCommentId(id) {
    const query = {
      text: 'UPDATE comments SET like_count = like_count - 1 WHERE id = $1',
      values: [id],
    };

    await this._pool.query(query);
  }
}

module.exports = CommentRepositoryPostgres;
