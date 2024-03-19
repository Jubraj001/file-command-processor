const fs = require("fs/promises");

(async () => {
  // Commands
  const CREATE_FILE = 'create a file';
  const DELETE_FILE = 'delete the file';
  const RENAME_FILE = 'rename the file';
  const ADD_TO_FILE = 'add to the file';

  let addedContent;

  const createFile = async (path) => {
    try {
      // Check whether or not if we have the file
      const existingFileHandle = await fs.open(path, 'r');
      // we already have the file
      existingFileHandle.close();
      return console.log(`The file ${path} already exists!`);
    } catch(error) {
      // Create the file
      const newFileHandle = await fs.open(path, 'w');
      console.log('The file was successfully created!');
      newFileHandle.close();
    }
  };

  const deleteFile = async (path) => {
    try {
      await fs.unlink(path);
      console.log('The file was successfully deleted!')
    } catch(error) {
      if(error.code === 'ENOENT') {
        console.log('No file at this path to remove!');
      } else {
        console.log('An error occurred while removing the file!');
        console.log(error);
      }
    }
  }

  const renameFile = async (oldPath, newPath) => {
    try {
      await fs.rename(oldPath, newPath);
      console.log('The file was successfully renamed!')
    } catch(error) {
      if(error.code === 'ENOENT') {
        console.log('No file at this path to rename, or the destination does not exist!');
      } else {
        console.log('An error occurred while renaming the file!');
        console.log(error);
      }
    }
  }

  const addToFile = async (path, content) => {
    if (addedContent === content) return;

    try {
      const fileHandle = await  fs.open(path, 'a');
      fileHandle.write(content);
      addedContent = content; // To prevent multiple identical events
      console.log('The content was successfully added to the file!')
    } catch(error) {
      if(error.code === 'ENOENT') {
        console.log('No file at this path exists to add to!');
      } else {
        console.log('An error occurred while adding content to the file!');
        console.log(error);
      }
    }
  }

  const commandFileHandler = await fs.open('./command.txt', 'r');
  const watcher = fs.watch("./command.txt");

  for await(const event of watcher) { // async iterator
    // SAMPLE LOGGING of event -> { eventType: 'change', filename: 'command.txt' }

    if(event.eventType === 'change') {
      // Get the size of the file so as to not allocate a buffer too large and waste memory
      const size  = (await commandFileHandler.stat()).size; // Provides the stats which contains `size`, `birthtime` etc.
      const buff = Buffer.alloc(size); // Allocate buffer with the size of file

      const offset = 0; // the location at which we want to start filling our buffer
      const length = buff.byteLength; // how many bytes we want to read
      const position = 0; // If not provided, it would start reading from where it last left

      // We always want to read the whole content from beginning to end
      await commandFileHandler.read(buff, offset, length, position);
      const command = buff.toString('utf-8');

      if(command.includes(CREATE_FILE)) {
        const filepath = command.substring(CREATE_FILE.length + 1);

        createFile(filepath);
      }

      if(command.includes(DELETE_FILE)) {
        const filepath = command.substring(DELETE_FILE.length + 1);

        deleteFile(filepath);
      }

      if(command.includes(RENAME_FILE)) {
        const _idx = command.indexOf(' to ');
        const oldFilePath = command.substring(RENAME_FILE.length + 1, _idx);
        const newFilePath = command.substring(_idx + 4);
        console.log(`Old File path ${oldFilePath}`);
        console.log(`New File path ${newFilePath}`);

        renameFile(oldFilePath, newFilePath);
      }

      if(command.includes(ADD_TO_FILE)) {
        const _idx = command.indexOf(" this content: ");
        const filepath = command.substring(ADD_TO_FILE.length + 1, _idx);
        const content = command.substring(_idx + 15);

        addToFile(filepath, content);
      }
    }
  }
})()

// PS: Event Emitter not working (.on, .emit) because fs.open gives a file descriptor rather than a file stream
