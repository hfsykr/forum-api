class GetThreadUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    await this._threadRepository.verifyThreadExistsById(threadId);
    const thread = await this._threadRepository.getThreadById(threadId);
    const threadComments = await this._commentRepository.getAllCommentByThreadId(threadId);
    const comments = await Promise.all(threadComments.map(async (comment) => {
      const commentReplies = await this._replyRepository.getAllReplyByCommentId(comment.id);
      const replies = commentReplies.map((reply) => ({
        id: reply.id,
        content: !reply.is_delete ? reply.content : '**balasan telah dihapus**',
        date: reply.date,
        username: reply.username,
      }));

      return {
        id: comment.id,
        username: comment.username,
        date: comment.date,
        replies,
        content: !comment.is_delete ? comment.content : '**komentar telah dihapus**',
      };
    }));

    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date,
      username: thread.username,
      comments,
    };
  }
}

module.exports = GetThreadUseCase;
