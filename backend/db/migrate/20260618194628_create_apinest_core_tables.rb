class CreateApinestCoreTables < ActiveRecord::Migration[8.0]
  def change
    # 1. Add admin column to users
    add_column :users, :admin, :boolean, default: false, null: false

    # 2. Collections
    create_table :collections, id: :uuid do |t|
      t.string :name, null: false
      t.text :description
      t.references :workspace, null: false, type: :uuid, foreign_key: { on_delete: :cascade }

      t.timestamps
    end

    # 3. Folders (Self-referencing for nested sub-folders)
    create_table :folders, id: :uuid do |t|
      t.string :name, null: false
      t.references :collection, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.uuid :parent_id

      t.timestamps
    end
    add_foreign_key :folders, :folders, column: :parent_id, on_delete: :cascade
    add_index :folders, :parent_id

    # 4. Requests
    create_table :requests, id: :uuid do |t|
      t.string :name, null: false
      t.string :method, null: false, default: 'GET'
      t.text :url, null: false
      t.jsonb :headers, default: []
      t.jsonb :params, default: []
      t.string :body_type, default: 'none'
      t.text :body_content
      t.string :auth_type, default: 'none'
      t.jsonb :auth_config, default: {}
      
      t.references :collection, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.references :folder, null: true, type: :uuid, foreign_key: { on_delete: :cascade }
      t.references :workspace, null: false, type: :uuid, foreign_key: { on_delete: :cascade }

      t.timestamps
    end

    # 5. Request Histories
    create_table :request_histories, id: :uuid do |t|
      t.references :user, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.references :workspace, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.uuid :request_id, null: true
      t.string :name
      t.string :method, null: false
      t.text :url, null: false
      t.jsonb :headers, default: []
      t.text :body_content
      t.integer :response_status
      t.integer :response_time_ms
      t.integer :response_size_bytes
      t.text :response_body
      t.jsonb :response_headers, default: {}

      t.datetime :created_at, null: false
    end
    add_index :request_histories, :created_at

    # 6. Environments
    create_table :environments, id: :uuid do |t|
      t.string :name, null: false
      t.references :workspace, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.boolean :is_active, default: false, null: false

      t.timestamps
    end

    # 7. Environment Variables
    create_table :environment_variables, id: :uuid do |t|
      t.references :environment, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.string :key, null: false
      t.text :value
      t.boolean :secret, default: false, null: false

      t.timestamps
    end
    add_index :environment_variables, [:environment_id, :key], unique: true

    # 8. API Monitors
    create_table :api_monitors, id: :uuid do |t|
      t.references :workspace, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.string :name, null: false
      t.text :url, null: false
      t.string :method, null: false, default: 'GET'
      t.jsonb :headers, default: []
      t.text :body_content
      t.integer :interval_minutes, default: 15, null: false
      t.datetime :last_checked_at
      t.boolean :is_active, default: true, null: false

      t.timestamps
    end

    # 9. API Monitor Logs
    create_table :api_monitor_logs, id: :uuid do |t|
      t.references :api_monitor, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.integer :response_status
      t.integer :response_time_ms
      t.boolean :success, default: true, null: false
      t.text :error_message

      t.datetime :created_at, null: false
    end
    add_index :api_monitor_logs, :created_at

    # 10. Notifications
    create_table :notifications, id: :uuid do |t|
      t.references :user, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.string :title, null: false
      t.text :message, null: false
      t.boolean :read, default: false, null: false

      t.datetime :created_at, null: false
    end
  end
end
