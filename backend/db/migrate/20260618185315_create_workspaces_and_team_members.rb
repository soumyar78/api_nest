class CreateWorkspacesAndTeamMembers < ActiveRecord::Migration[8.0]
  def change
    create_table :workspaces, id: :uuid do |t|
      t.string :name, null: false
      t.references :user, null: false, type: :uuid, foreign_key: { on_delete: :cascade }

      t.timestamps
    end
  end
end
