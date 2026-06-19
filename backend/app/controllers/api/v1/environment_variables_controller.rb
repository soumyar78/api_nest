module Api
  module V1
    class EnvironmentVariablesController < ApiController
      # POST /api/v1/environments/:environment_id/environment_variables
      def create
        environment = Environment.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:environment_id])
        variable = environment.environment_variables.new(variable_params)

        if variable.save
          render json: { variable: EnvironmentVariableSerializer.render_as_hash(variable) }, status: :created
        else
          render json: { errors: variable.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Environment not found" }, status: :not_found
      end

      # PUT /api/v1/environments/:environment_id/environment_variables/:id
      def update
        environment = Environment.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:environment_id])
        variable = environment.environment_variables.find(params[:id])

        if variable.update(variable_params)
          render json: { variable: EnvironmentVariableSerializer.render_as_hash(variable) }, status: :ok
        else
          render json: { errors: variable.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Variable not found" }, status: :not_found
      end

      # DELETE /api/v1/environments/:environment_id/environment_variables/:id
      def destroy
        environment = Environment.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:environment_id])
        variable = environment.environment_variables.find(params[:id])
        variable.destroy
        render json: { message: "Variable deleted successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Variable not found" }, status: :not_found
      end

      private

      def variable_params
        params.permit(:key, :value, :secret)
      end
    end
  end
end
