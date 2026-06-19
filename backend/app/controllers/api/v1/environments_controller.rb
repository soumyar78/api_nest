module Api
  module V1
    class EnvironmentsController < ApiController
      # GET /api/v1/environments
      def index
        workspace = current_user.workspaces.find(params[:workspace_id])
        environments = workspace.environments.order(created_at: :asc)
        render json: { environments: EnvironmentSerializer.render_as_hash(environments) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      # GET /api/v1/environments/:id
      def show
        environment = Environment.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        render json: { environment: EnvironmentSerializer.render_as_hash(environment) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Environment not found" }, status: :not_found
      end

      # POST /api/v1/environments
      def create
        workspace = current_user.workspaces.find(params[:workspace_id])
        environment = workspace.environments.new(environment_params)

        if environment.save
          render json: { environment: EnvironmentSerializer.render_as_hash(environment) }, status: :created
        else
          render json: { errors: environment.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      # PUT /api/v1/environments/:id
      def update
        environment = Environment.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])

        if environment.update(environment_params)
          render json: { environment: EnvironmentSerializer.render_as_hash(environment) }, status: :ok
        else
          render json: { errors: environment.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Environment not found" }, status: :not_found
      end

      # DELETE /api/v1/environments/:id
      def destroy
        environment = Environment.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        environment.destroy
        render json: { message: "Environment deleted successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Environment not found" }, status: :not_found
      end

      # POST /api/v1/environments/:id/activate
      def activate
        environment = Environment.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        environment.activate!
        render json: {
          message: "Environment '#{environment.name}' is now active",
          environment: EnvironmentSerializer.render_as_hash(environment)
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Environment not found" }, status: :not_found
      end

      private

      def environment_params
        params.permit(:name)
      end
    end
  end
end
