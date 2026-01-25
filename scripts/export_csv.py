import pandas

json_file_path="scripts/game_info.json"

# CSV
pandas.read_json(json_file_path).to_csv("full_game_info.csv", index=False)

# Excel (.xlsx) if you want use .xlsx file
# pandas.read_json(json_file_path).to_excel("full_game_info.xlsx", index=False)