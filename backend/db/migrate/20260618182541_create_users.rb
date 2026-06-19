class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')

    create_table :users, id: :uuid do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name
      t.datetime :confirmed_at
      t.string :confirmation_token
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.string :refresh_token
      t.datetime :refresh_token_expires_at

      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, :confirmation_token, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :refresh_token, unique: true
  end
end
