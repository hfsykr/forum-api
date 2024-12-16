class DeleteCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId, commentId, userId) {
    await this._threadRepository.verifyThreadExistsById(threadId);
    await this._commentRepository.verifyCommentExistsById(commentId);
    await this._commentRepository.verifyOwnerByUserId(commentId, userId);
    await this._commentRepository.deleteCommentById(commentId);
  }
}

module.exports = DeleteCommentUseCase;
