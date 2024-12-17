const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');
const LikeCommentUseCase = require('../../../../Applications/use_case/LikeCommentUseCase');


class CommentsHandler {
  constructor(container) {
    this._container = container;

    this.postCommentHandler = this.postCommentHandler.bind(this);
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
    this.putLikeCommentHandler = this.putLikeCommentHandler.bind(this);
  }

  async postCommentHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { threadId } = request.params;
    const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
    const addedComment = await addCommentUseCase.execute(threadId, userId, request.payload);

    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });

    response.code(201);

    return response;
  }

  async deleteCommentHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;
    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
    await deleteCommentUseCase.execute(threadId, commentId, userId);

    const response = h.response({
      status: 'success',
    });

    response.code(200);

    return response;
  }

  async putLikeCommentHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;
    const likeCommentUseCase = this._container.getInstance(LikeCommentUseCase.name);
    await likeCommentUseCase.execute(threadId, commentId, userId);

    const response = h.response({
      status: 'success',
    });

    response.code(200);

    return response;
  }
}

module.exports = CommentsHandler;
