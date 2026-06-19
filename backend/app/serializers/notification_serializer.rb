class NotificationSerializer < Blueprinter::Base
  identifier :id

  fields :user_id, :title, :message, :read, :created_at
end
