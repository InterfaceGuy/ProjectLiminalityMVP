import json
import os
import subprocess

CANVAS_FILE = "DreamSong.canvas"
BASE_URL = "https://github.com/InterfaceGuy/"
DIRECTORY_LISTING_FILE = "directory-listing.json"
EXCLUDE_SUBMODULES = ['DreamSongUI']  # Submodules to exclude from removal

def parse_canvas_file(file_path):
    # Get the absolute path of the canvas file
    abs_canvas_path = os.path.abspath(file_path)
    # Get the parent directory of the canvas file
    canvas_dir = os.path.dirname(abs_canvas_path)
    # Get the name of the parent folder
    canvas_parent_folder = os.path.basename(canvas_dir)
    
    external_media_repos = []
    
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    for node in data['nodes']:
        if node['type'] == 'file':
            media_path = node['file']
            # Get the first part of the media path (parent folder)
            media_parent_folder = media_path.split('/')[0]
            # Check if the media parent folder is different from the canvas parent folder
            if media_parent_folder != canvas_parent_folder:
                if media_parent_folder not in external_media_repos:
                    external_media_repos.append(media_parent_folder)
                # Update the media path to include the canvas parent folder
                new_media_path = os.path.join(canvas_parent_folder, media_path)
                node['file'] = new_media_path
    
    # Save the updated canvas file
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=2)
    
    return external_media_repos

def update_submodules(repos):
    # Read the current submodules from .gitmodules
    current_submodules = []
    if os.path.exists('.gitmodules'):
        with open('.gitmodules', 'r') as file:
            for line in file:
                if 'path' in line:
                    current_submodules.append(line.split('=')[1].strip())
    
    # Determine submodules to add and remove
    to_add = set(repos) - set(current_submodules)
    to_remove = set(current_submodules) - set(repos)
    
    # Add new submodules
    for repo in to_add:
        url = f"{BASE_URL}{repo}.git"
        subprocess.run(['git', 'submodule', 'add', url, repo])
    
    # Update the submodules to the latest commit
    subprocess.run(['git', 'submodule', 'update', '--init', '--recursive'])
    
    # Generate a list of currently used submodules by parsing canvas file
    used_submodules = get_used_submodules(CANVAS_FILE)

    # Remove old submodules that are not used
    for repo in to_remove:
        if repo in used_submodules or repo in EXCLUDE_SUBMODULES:  # Exclude specified submodules from removal
            continue
        subprocess.run(['git', 'submodule', 'deinit', '-f', repo])
        subprocess.run(['git', 'rm', '-f', repo])
        subprocess.run(['rm', '-rf', f'.git/modules/{repo}'])

def get_used_submodules(file_path):
    # Parse the canvas file to get the list of used submodules
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    parent_folder = os.path.basename(os.path.dirname(os.path.abspath(file_path)))
    used_submodules = set()
    
    for node in data['nodes']:
        if node['type'] == 'file':
            file_path = node['file']
            if file_path.startswith(parent_folder):
                relative_path = file_path[len(parent_folder)+1:]
                if '/' in relative_path:
                    submodule = relative_path.split('/')[0]
                    used_submodules.add(submodule)
    
    return used_submodules

def generate_directory_listing(root_dir):
    directory_listing = {}
    parent_directory = os.path.basename(os.getcwd())

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.')]  # Filter out hidden directories
        files = [f for f in files if not f.startswith('.')]  # Filter out hidden files

        relative_root = os.path.relpath(root, root_dir)

        if relative_root == '.':
            current_dir = directory_listing
        else:
            current_dir = current_dir.setdefault(relative_root, {})

        for file in files:
            file_path = os.path.join(relative_root, file)
            current_dir[file] = None

        for dir in dirs:
            dir_path = os.path.join(relative_root, dir)
            current_dir[dir] = {}

    directory_listing["parent_directory"] = parent_directory

    return directory_listing

if __name__ == "__main__":
    repos = parse_canvas_file(CANVAS_FILE)
    update_submodules(repos)
    root_dir = "."  # Change this to the desired root directory
    directory_listing = generate_directory_listing(root_dir)

    with open(DIRECTORY_LISTING_FILE, "w") as file:
        json.dump(directory_listing, file, indent=2)