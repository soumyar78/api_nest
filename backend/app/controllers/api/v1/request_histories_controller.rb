module Api
  module V1
    class RequestHistoriesController < ApiController
      # GET /api/v1/request_histories
      def index
        workspace = current_user.workspaces.find(params[:workspace_id])
        histories = workspace.request_histories.order(created_at: :desc)

        # Filters
        if params[:method].present?
          histories = histories.where(method: params[:method].to_s.upcase)
        end
        if params[:search].present?
          histories = histories.where("url LIKE ?", "%#{params[:search]}%")
        end

        # Pagination
        page = params[:page] || 1
        per_page = params[:per_page] || 50
        histories = histories.page(page).per(per_page) if histories.respond_to?(:page)

        render json: {
          histories: RequestHistorySerializer.render_as_hash(histories)
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      # DELETE /api/v1/request_histories/:id
      def destroy
        history = current_user.request_histories.find(params[:id])
        history.destroy
        render json: { message: "History entry deleted successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "History entry not found" }, status: :not_found
      end

      # DELETE /api/v1/request_histories/clear_all
      def clear_all
        workspace = current_user.workspaces.find(params[:workspace_id])
        workspace.request_histories.destroy_all
        render json: { message: "Request history cleared successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end
    end
  end
end
