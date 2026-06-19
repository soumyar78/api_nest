module Api
  module V1
    class WorkspacesController < ApiController
      def index
        workspaces = current_user.workspaces.order(created_at: :asc)
        render json: { workspaces: WorkspaceSerializer.render_as_hash(workspaces) }, status: :ok
      end

      def show
        workspace = current_user.workspaces.find(params[:id])
        render json: { workspace: WorkspaceSerializer.render_as_hash(workspace) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Workspace not found.' }, status: :not_found
      end

      def create
        workspace = current_user.workspaces.new(workspace_params)

        if workspace.save
          render json: { workspace: WorkspaceSerializer.render_as_hash(workspace) }, status: :created
        else
          render json: { errors: workspace.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        workspace = current_user.workspaces.find(params[:id])

        if workspace.update(workspace_params)
          render json: { workspace: WorkspaceSerializer.render_as_hash(workspace) }, status: :ok
        else
          render json: { errors: workspace.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Workspace not found.' }, status: :not_found
      end

      def destroy
        workspace = current_user.workspaces.find(params[:id])

        if current_user.workspaces.count <= 1
          return render json: { error: 'Forbidden: cannot delete your last remaining workspace.' }, status: :forbidden
        end

        workspace.destroy
        render json: { message: 'Workspace successfully deleted.' }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Workspace not found.' }, status: :not_found
      end

      def stats
        workspace = current_user.workspaces.find(params[:id])
        
        total_collections = workspace.collections.count
        
        total_runs = workspace.request_histories.count
        success_runs = workspace.request_histories.where(response_status: 100..399).count
        success_rate = total_runs > 0 ? ((success_runs.to_f / total_runs) * 100).round : 100
        
        avg_latency = workspace.request_histories.where(response_status: 100..399).average(:response_time_ms)&.to_i || 0
        recent_count = workspace.request_histories.where(created_at: 24.hours.ago..Time.current).count

        render json: {
          stats: {
            total_collections: total_collections,
            average_latency_ms: avg_latency,
            success_rate_percentage: success_rate,
            recent_requests_count: recent_count
          }
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Workspace not found.' }, status: :not_found
      end

      private

      def workspace_params
        params.permit(:name)
      end
    end
  end
end
