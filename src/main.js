import './style.css'

import { addButtonListeners } from "./utils/navigation-utils";
import { SocketManager } from "./network/SocketManager.js";
import { io } from 'socket.io-client';

// import { translatePage } from "./translation-utils.js";

addButtonListeners();

export const uri = "https://pingpong-server-yx2a.onrender.com/";

export const socket = io(uri);

const socketManager = new SocketManager(socket);
