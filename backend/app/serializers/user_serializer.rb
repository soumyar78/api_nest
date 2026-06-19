class UserSerializer < Blueprinter::Base
  identifier :id

  fields :email, :name, :confirmed_at, :created_at
end
