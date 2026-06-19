module Api
  module V1
    class RequestsController < ApiController
      skip_before_action :authenticate_user!, only: [:send_request]

      # POST /api/v1/requests
      def create
        collection = current_user.workspaces.joins(:collections).find_by(collections: { id: params[:collection_id] })&.collections&.find(params[:collection_id])
        unless collection
          return render json: { error: "Collection not found" }, status: :not_found
        end

        request_item = collection.requests.new(request_params)
        request_item.workspace = collection.workspace

        if request_item.save
          render json: { request: RequestSerializer.render_as_hash(request_item) }, status: :created
        else
          render json: { errors: request_item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/requests/:id
      def update
        request_item = Request.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])

        if request_item.update(request_params)
          render json: { request: RequestSerializer.render_as_hash(request_item) }, status: :ok
        else
          render json: { errors: request_item.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Request not found" }, status: :not_found
      end

      # DELETE /api/v1/requests/:id
      def destroy
        request_item = Request.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        request_item.destroy
        render json: { message: "Request deleted successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Request not found" }, status: :not_found
      end

      # POST /api/v1/requests/send_request
      def send_request
        # Check if an Authorization token is present
        auth_header = request.headers["Authorization"]
        token = auth_header.split(" ").last if auth_header

        user = nil
        if token.present?
          begin
            decoded = JwtService.decode(token)
            user = User.find_by(id: decoded[:user_id]) if decoded && decoded[:user_id]
          rescue => e
            logger.warn "Failed to decode JWT token: #{e.message}"
          end
        end

        if user
          workspace = user.workspaces.find(params[:workspace_id])
          
          result = RequestExecutorService.execute(
            workspace: workspace,
            method: params[:method],
            url: params[:url],
            headers: params[:headers],
            params: params[:params],
            body_type: params[:body_type],
            body_content: params[:body_content],
            auth_type: params[:auth_type],
            auth_config: params[:auth_config]
          )

          # Log to RequestHistory only for authenticated users
          history = user.request_histories.create!(
            workspace: workspace,
            request_id: params[:request_id],
            name: params[:name] || params[:url],
            method: params[:method],
            url: params[:url],
            headers: params[:headers] || [],
            body_content: params[:body_content],
            response_status: result[:status],
            response_time_ms: result[:time_ms],
            response_size_bytes: result[:size_bytes],
            response_body: result[:body],
            response_headers: result[:headers]
          )

          render json: {
            response: result,
            history: RequestHistorySerializer.render_as_hash(history)
          }, status: :ok
        else
          # Guest request - no workspace resolution, no history persistence
          result = RequestExecutorService.execute(
            workspace: nil,
            method: params[:method],
            url: params[:url],
            headers: params[:headers],
            params: params[:params],
            body_type: params[:body_type],
            body_content: params[:body_content],
            auth_type: params[:auth_type],
            auth_config: params[:auth_config]
          )

          render json: {
            response: result,
            history: nil
          }, status: :ok
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      private

      def request_params
        params.permit(
          :name, :method, :url, :body_type, :body_content, :auth_type, :collection_id, :folder_id,
          headers: [:key, :value, :enabled],
          params: [:key, :value, :enabled],
          auth_config: [:token, :username, :password, :key, :value, :in, :accessToken]
        )
      end
    end
  end
end
