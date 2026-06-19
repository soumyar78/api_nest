# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_06_18_194628) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "api_monitor_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "api_monitor_id", null: false
    t.integer "response_status"
    t.integer "response_time_ms"
    t.boolean "success", default: true, null: false
    t.text "error_message"
    t.datetime "created_at", null: false
    t.index ["api_monitor_id"], name: "index_api_monitor_logs_on_api_monitor_id"
    t.index ["created_at"], name: "index_api_monitor_logs_on_created_at"
  end

  create_table "api_monitors", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "workspace_id", null: false
    t.string "name", null: false
    t.text "url", null: false
    t.string "method", default: "GET", null: false
    t.jsonb "headers", default: []
    t.text "body_content"
    t.integer "interval_minutes", default: 15, null: false
    t.datetime "last_checked_at"
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["workspace_id"], name: "index_api_monitors_on_workspace_id"
  end

  create_table "collections", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.uuid "workspace_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["workspace_id"], name: "index_collections_on_workspace_id"
  end

  create_table "environment_variables", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "environment_id", null: false
    t.string "key", null: false
    t.text "value"
    t.boolean "secret", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["environment_id", "key"], name: "index_environment_variables_on_environment_id_and_key", unique: true
    t.index ["environment_id"], name: "index_environment_variables_on_environment_id"
  end

  create_table "environments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.uuid "workspace_id", null: false
    t.boolean "is_active", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["workspace_id"], name: "index_environments_on_workspace_id"
  end

  create_table "folders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.uuid "collection_id", null: false
    t.uuid "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["collection_id"], name: "index_folders_on_collection_id"
    t.index ["parent_id"], name: "index_folders_on_parent_id"
  end

  create_table "notifications", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "title", null: false
    t.text "message", null: false
    t.boolean "read", default: false, null: false
    t.datetime "created_at", null: false
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "request_histories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "workspace_id", null: false
    t.uuid "request_id"
    t.string "name"
    t.string "method", null: false
    t.text "url", null: false
    t.jsonb "headers", default: []
    t.text "body_content"
    t.integer "response_status"
    t.integer "response_time_ms"
    t.integer "response_size_bytes"
    t.text "response_body"
    t.jsonb "response_headers", default: {}
    t.datetime "created_at", null: false
    t.index ["created_at"], name: "index_request_histories_on_created_at"
    t.index ["user_id"], name: "index_request_histories_on_user_id"
    t.index ["workspace_id"], name: "index_request_histories_on_workspace_id"
  end

  create_table "requests", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "method", default: "GET", null: false
    t.text "url", null: false
    t.jsonb "headers", default: []
    t.jsonb "params", default: []
    t.string "body_type", default: "none"
    t.text "body_content"
    t.string "auth_type", default: "none"
    t.jsonb "auth_config", default: {}
    t.uuid "collection_id", null: false
    t.uuid "folder_id"
    t.uuid "workspace_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["collection_id"], name: "index_requests_on_collection_id"
    t.index ["folder_id"], name: "index_requests_on_folder_id"
    t.index ["workspace_id"], name: "index_requests_on_workspace_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name"
    t.datetime "confirmed_at"
    t.string "confirmation_token"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.string "refresh_token"
    t.datetime "refresh_token_expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "admin", default: false, null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["refresh_token"], name: "index_users_on_refresh_token", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "workspaces", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.uuid "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_workspaces_on_user_id"
  end

  add_foreign_key "api_monitor_logs", "api_monitors", on_delete: :cascade
  add_foreign_key "api_monitors", "workspaces", on_delete: :cascade
  add_foreign_key "collections", "workspaces", on_delete: :cascade
  add_foreign_key "environment_variables", "environments", on_delete: :cascade
  add_foreign_key "environments", "workspaces", on_delete: :cascade
  add_foreign_key "folders", "collections", on_delete: :cascade
  add_foreign_key "folders", "folders", column: "parent_id", on_delete: :cascade
  add_foreign_key "notifications", "users", on_delete: :cascade
  add_foreign_key "request_histories", "users", on_delete: :cascade
  add_foreign_key "request_histories", "workspaces", on_delete: :cascade
  add_foreign_key "requests", "collections", on_delete: :cascade
  add_foreign_key "requests", "folders", on_delete: :cascade
  add_foreign_key "requests", "workspaces", on_delete: :cascade
  add_foreign_key "workspaces", "users", on_delete: :cascade
end
