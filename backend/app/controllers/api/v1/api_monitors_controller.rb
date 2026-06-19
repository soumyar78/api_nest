module Api
  module V1
    class ApiMonitorsController < ApiController
      # GET /api/v1/api_monitors
      def index
        workspace = current_user.workspaces.find(params[:workspace_id])
        monitors = workspace.api_monitors.order(created_at: :asc)

        # Build list with aggregated stats
        monitors_data = monitors.map do |monitor|
          logs = monitor.api_monitor_logs.order(created_at: :desc).limit(20)
          total_runs = monitor.api_monitor_logs.count
          success_runs = monitor.api_monitor_logs.where(success: true).count
          
          uptime = total_runs > 0 ? ((success_runs.to_f / total_runs) * 100).round(2) : 100.0
          avg_latency = monitor.api_monitor_logs.where(success: true).average(:response_time_ms)&.to_f&.round || 0

          monitor_hash = ApiMonitorSerializer.render_as_hash(monitor)
          monitor_hash.merge({
            uptime_percentage: uptime,
            avg_latency_ms: avg_latency,
            total_checks: total_runs,
            recent_logs: ApiMonitorLogSerializer.render_as_hash(logs)
          })
        end

        render json: { api_monitors: monitors_data }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      # GET /api/v1/api_monitors/:id
      def show
        monitor = ApiMonitor.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        
        # Aggregate detailed stats
        logs = monitor.api_monitor_logs.order(created_at: :desc).limit(100)
        total_runs = monitor.api_monitor_logs.count
        success_runs = monitor.api_monitor_logs.where(success: true).count
        uptime = total_runs > 0 ? ((success_runs.to_f / total_runs) * 100).round(2) : 100.0
        avg_latency = monitor.api_monitor_logs.where(success: true).average(:response_time_ms)&.to_f&.round || 0

        monitor_hash = ApiMonitorSerializer.render_as_hash(monitor)
        render json: {
          api_monitor: monitor_hash.merge({
            uptime_percentage: uptime,
            avg_latency_ms: avg_latency,
            total_checks: total_runs,
            recent_logs: ApiMonitorLogSerializer.render_as_hash(logs)
          })
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Monitor not found" }, status: :not_found
      end

      # POST /api/v1/api_monitors
      def create
        workspace = current_user.workspaces.find(params[:workspace_id])
        monitor = workspace.api_monitors.new(monitor_params)

        if monitor.save
          render json: { api_monitor: ApiMonitorSerializer.render_as_hash(monitor) }, status: :created
        else
          render json: { errors: monitor.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      # PUT /api/v1/api_monitors/:id
      def update
        monitor = ApiMonitor.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])

        if monitor.update(monitor_params)
          render json: { api_monitor: ApiMonitorSerializer.render_as_hash(monitor) }, status: :ok
        else
          render json: { errors: monitor.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Monitor not found" }, status: :not_found
      end

      # DELETE /api/v1/api_monitors/:id
      def destroy
        monitor = ApiMonitor.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        monitor.destroy
        render json: { message: "Monitor deleted successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Monitor not found" }, status: :not_found
      end

      # POST /api/v1/api_monitors/:id/toggle_active
      def toggle_active
        monitor = ApiMonitor.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        monitor.update!(is_active: !monitor.is_active)
        render json: {
          message: "Monitor status toggled",
          api_monitor: ApiMonitorSerializer.render_as_hash(monitor)
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Monitor not found" }, status: :not_found
      end

      private

      def monitor_params
        params.permit(:name, :url, :method, :interval_minutes, :body_content, :is_active, headers: [:key, :value, :enabled])
      end
    end
  end
end
