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

const socket = io("http://localhost:3000");

const Game = () => {
  const canvasRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [apples, setApples] = useState([]);
  const lastSentPositionRef = useRef({ x: 0, y: 0 });

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

    socket.emit(SocketEvents.CreatePlayer, "shaggy");

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

  // Handle player movement
  // const movePlayer = throttle((e) => {
  //   if (!currentPlayer) return;

  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const rect = canvas.getBoundingClientRect();
  //   const mouseX = e.clientX - rect.left - canvas.width / 2;
  //   const mouseY = e.clientY - rect.top - canvas.height / 2;

  //   const speed = 2; // Adjust speed
  //   const predictedX = currentPlayer.x + mouseX * 0.01 * speed;
  //   const predictedY = currentPlayer.y + mouseY * 0.01 * speed;

  //   const { x: lastX, y: lastY } = lastSentPositionRef.current;

  //   // Update only if there's significant movement
  //   if (Math.abs(predictedX - lastX) > 1 || Math.abs(predictedY - lastY) > 1) {
  //     setCurrentPlayer((prev) => ({ ...prev, x: predictedX, y: predictedY }));
  //     lastSentPositionRef.current = { x: predictedX, y: predictedY };
  //     socket.emit(SocketEvents.UpdatePlayerPosition, predictedX, predictedY);
  //   }
  // }, 100); // Throttle to 500ms
  const movePlayer = throttle((e) => {
    if (!currentPlayer) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // Mouse position relative to canvas
    const mouseY = e.clientY - rect.top;

    // Send raw mouse position directly to the server
    const target = { x: mouseX, y: mouseY };
    socket.emit(SocketEvents.UpdatePlayerPosition, target);

    console.log("Raw mouse position sent:", target);
  }, 100); // Throttle to 100ms

  // Render the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    const render = () => {
      if (!currentPlayer) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate viewport
      const viewportX = currentPlayer.x - canvas.width / 2;
      const viewportY = currentPlayer.y - canvas.height / 2;

      ctx.save();
      ctx.translate(-viewportX, -viewportY);

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
              ctx.fillStyle = player.color || "blue"; // Use the player's color for the cell
              ctx.fill();
              ctx.closePath();
            }
          });
        }
      });
      // players.forEach((player) => {
      //   if (player.cells) {
      //     ctx.beginPath();
      //     ctx.arc(player.x, player.y, player.size || 10, 0, Math.PI * 2);
      //     ctx.fillStyle = player.color || "blue";
      //     ctx.fill();
      //     ctx.closePath();
      //   }
      // });

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

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
      // requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId); // Cleanup on unmount or dependency change
    };
  }, [currentPlayer, players, apples]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={1000}
      onMouseMove={movePlayer}
      style={{ display: "block", margin: "auto", border: "1px solid black" }}
    />
  );
};

export default Game;
