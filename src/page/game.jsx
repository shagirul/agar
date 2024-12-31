import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { throttle } from "lodash";

// Enum for socket events
const SocketEvents = Object.freeze({
  Connection: "connection",
  PlayerCreated: "playerCreated",
  CreatePlayer: "createPlayer",
  UpdatePlayerPosition: "updatePlayerPosition",
  GameState: "gameState",
  PlayerDisconnected: "playerDisconnected",
});

// Connect to the Socket.IO server
const socket = io("http://localhost:3000");

const Game = () => {
  const canvasRef = useRef(null); // Reference to the canvas element
  const [players, setPlayers] = useState([]); // State to hold player data
  const [currentPlayer, setCurrentPlayer] = useState(null); // State for the current player
  const [apples, setApples] = useState([]); // State for apple positions
  const [translate, setTranslate] = useState({ x: 0, y: 0 }); // Current canvas translation
  const [isMoving, setIsMoving] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  }); // Tracks directional movement
  const moveSpeed = 2; // Speed for translating the canvas
  const boundaryOffset = 200; // Distance from the canvas edges to trigger movement

  // Socket event listeners
  useEffect(() => {
    const handleGameState = (gameState) => {
      setPlayers(gameState.players || []);
      setApples(gameState.apples || []);
    };

    const handlePlayerCreated = (playerData) => {
      setCurrentPlayer(playerData);
    };

    const handlePlayerDisconnected = (playerId) => {
      setPlayers((prevPlayers) =>
        prevPlayers.filter((player) => player.id !== playerId)
      );
    };

    socket.on(SocketEvents.GameState, handleGameState);
    socket.on(SocketEvents.PlayerCreated, handlePlayerCreated);
    socket.on(SocketEvents.PlayerDisconnected, handlePlayerDisconnected);

    // Notify the server to create a new player
    socket.emit(SocketEvents.CreatePlayer, "shaggy");

    // Clean up on unload
    const handleBeforeUnload = () => {
      socket.emit(SocketEvents.PlayerDisconnected);
      socket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off(SocketEvents.GameState, handleGameState);
      socket.off(SocketEvents.PlayerCreated, handlePlayerCreated);
      socket.off(SocketEvents.PlayerDisconnected, handlePlayerDisconnected);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentPlayer]);

  // Handle mouse movement for canvas translation
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Determine if the mouse is near the edges of the canvas
    const moveUp = mouseY < boundaryOffset;
    const moveDown = mouseY > canvas.height - boundaryOffset;
    const moveLeft = mouseX < boundaryOffset;
    const moveRight = mouseX > canvas.width - boundaryOffset;

    setIsMoving({
      up: moveUp,
      down: moveDown,
      left: moveLeft,
      right: moveRight,
    });
  };

  // Update canvas translation at regular intervals
  useEffect(() => {
    const moveCanvas = () => {
      setTranslate((prev) => ({
        x:
          prev.x +
          (isMoving.right ? moveSpeed : isMoving.left ? -moveSpeed : 0),
        y: prev.y + (isMoving.down ? moveSpeed : isMoving.up ? -moveSpeed : 0),
      }));
    };

    const interval = setInterval(moveCanvas, 16); // 60 FPS
    return () => clearInterval(interval);
  }, [isMoving]);

  // Send player position updates to the server
  const movePlayer = throttle((e) => {
    if (!currentPlayer) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // Mouse position relative to canvas
    const mouseY = e.clientY - rect.top;

    // Convert to global game coordinates by adjusting for canvas translation
    const globalMouseX = mouseX + translate.x;
    const globalMouseY = mouseY + translate.y;

    // Send the adjusted position to the server
    const target = { x: globalMouseX, y: globalMouseY };
    socket.emit(SocketEvents.UpdatePlayerPosition, target);
  }, 100); // Throttle to 100ms

  // Render the game canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const render = () => {
      if (!currentPlayer) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-translate.x, -translate.y); // Apply canvas translation

      // Draw players
      players.forEach((player) => {
        if (player.cells && player.cells.length > 0) {
          player.cells.forEach((cell) => {
            if (cell.position && cell.size) {
              ctx.beginPath();
              ctx.arc(
                cell.position.x,
                cell.position.y,
                cell.size,
                0,
                Math.PI * 2
              );
              ctx.fillStyle = player.color || "blue"; // Default to blue if no color
              ctx.fill();
              ctx.closePath();
            }
          });
        }
      });

      // Draw apples
      apples.forEach((apple) => {
        if (apple.position && apple.size) {
          ctx.beginPath();
          ctx.arc(
            apple.position.x,
            apple.position.y,
            apple.size,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = "red";
          ctx.fill();
          ctx.closePath();
        }
      });

      ctx.restore(); // Restore canvas state
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId); // Cleanup on unmount
    };
  }, [translate, currentPlayer, players, apples]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={1000}
      onMouseMove={(e) => {
        handleMouseMove(e);
        movePlayer(e);
      }}
      style={{ display: "block", margin: "auto", border: "1px solid black" }}
    />
  );
};

export default Game;
