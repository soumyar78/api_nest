module Api
  module V1
    class NotificationsController < ApiController
      # GET /api/v1/notifications
      def index
        notifications = current_user.notifications.order(created_at: :desc).limit(50)
        render json: { notifications: NotificationSerializer.render_as_hash(notifications) }, status: :ok
      end

      # POST /api/v1/notifications/:id/read
      def read
        notification = current_user.notifications.find(params[:id])
        notification.update!(read: true)
        render json: { notification: NotificationSerializer.render_as_hash(notification) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Notification not found" }, status: :not_found
      end
    end
  end
end
