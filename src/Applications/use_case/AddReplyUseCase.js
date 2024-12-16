const NewReply = require('../../Domains/replies/entities/NewReply');

class AddReplyUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId, commentId, userId, useCasePayload) {
    const newReply = new NewReply(useCasePayload);
    await this._threadRepository.verifyThreadExistsById(threadId);
    await this._commentRepository.verifyCommentExistsById(commentId);

    return this._replyRepository.addReply(commentId, userId, newReply);
  }
}

module.exports = AddReplyUseCase;
