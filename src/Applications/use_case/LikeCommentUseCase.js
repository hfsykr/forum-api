class LikeCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId, commentId, userId) {
    await this._threadRepository.verifyThreadExistsById(threadId);
    await this._commentRepository.verifyCommentExistsById(commentId);
    const hasLike = await this._commentRepository.verifyUserHasLikeComment(commentId, userId);
    if (!hasLike) {
      await this._commentRepository.addCommentLike(commentId, userId);
      await this._commentRepository.increaseLikeCountByCommentId(commentId);
    } else {
      await this._commentRepository.deleteCommentLike(commentId, userId);
      await this._commentRepository.decreaseLikeCountByCommentId(commentId);
    }
  }
}

module.exports = LikeCommentUseCase;
