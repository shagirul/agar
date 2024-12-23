// // export default Game;
// import { useState, useEffect, useRef } from "react";
// import { io } from "socket.io-client";
// import { throttle } from "lodash";

// // Enum for socket events
// const SocketEvents = Object.freeze({
//   Connection: "connection",
//   PlayerCreated: "playerCreated",
//   CreatePlayer: "createPlayer",
//   UpdatePlayerPosition: "updatePlayerPosition",
//   GameState: "gameState",
//   PlayerDisconnected: "playerDisconnected",
// });

// const socket = io("http://localhost:3000");

// const Game = () => {
//   const canvasRef = useRef(null);
//   const [players, setPlayers] = useState([]);
//   const [currentPlayer, setCurrentPlayer] = useState(null);
//   const [apples, setApples] = useState([]);
//   const [lastSentPosition, setLastSentPosition] = useState({ x: 0, y: 0 });

//   // Set up socket events on component mount
//   useEffect(() => {
//     socket.on(SocketEvents.GameState, (gameState) => {
//       if (gameState) {
//         setPlayers(gameState.players || []);
//         setApples(gameState.apples || []);
//       }
//     });

//     socket.on(SocketEvents.PlayerCreated, (playerData) => {
//       if (playerData && playerData.id) {
//         setCurrentPlayer(playerData);
//       }
//     });

//     socket.on(SocketEvents.PlayerDisconnected, (playerId) => {
//       setPlayers((prevPlayers) =>
//         prevPlayers.filter((player) => player.id !== playerId)
//       );
//     });

//     socket.emit(SocketEvents.CreatePlayer, "shaggy");

//     const handleBeforeUnload = () => {
//       socket.emit(SocketEvents.PlayerDisconnected);
//       socket.disconnect();
//     };
//     window.addEventListener("beforeunload", handleBeforeUnload);

//     return () => {
//       socket.off(SocketEvents.GameState);
//       socket.off(SocketEvents.PlayerCreated);
//       socket.off(SocketEvents.PlayerDisconnected);
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//     };
//   }, []);

//   const movePlayer = throttle((e) => {
//     if (!currentPlayer) return;

//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const rect = canvas.getBoundingClientRect();
//     const mouseX = e.clientX - rect.left - canvas.width / 2;
//     const mouseY = e.clientY - rect.top - canvas.height / 2;

//     const speed = 2; // Adjust as needed
//     const predictedX = currentPlayer.x + mouseX * 0.01 * speed;
//     const predictedY = currentPlayer.y + mouseY * 0.01 * speed;

//     if (
//       predictedX !== lastSentPosition.x ||
//       predictedY !== lastSentPosition.y
//     ) {
//       setCurrentPlayer((prev) => ({ ...prev, x: predictedX, y: predictedY }));
//       setLastSentPosition({ x: predictedX, y: predictedY });

//       socket.emit(SocketEvents.UpdatePlayerPosition, predictedX, predictedY);
//     }
//   }, 100);

//   // Interpolation for smooth rendering of other players' positions
//   useEffect(() => {
//     const interpolate = (current, target, factor) => {
//       return current + (target - current) * factor;
//     };

//     const interval = setInterval(() => {
//       if (currentPlayer && players) {
//         // Interpolate other players' positions to make movement smooth
//         const updatedPlayers = players.map((player) => {
//           if (player.id !== currentPlayer.id) {
//             const prevPosition = players.find((p) => p.id === player.id);
//             if (prevPosition) {
//               return {
//                 ...player,
//                 x: interpolate(prevPosition.x, player.x, 0.1), // Smooth movement to server position
//                 y: interpolate(prevPosition.y, player.y, 0.1),
//               };
//             }
//           }
//           return player;
//         });

//         setPlayers(updatedPlayers);
//       }
//     }, 16); // Approx 60fps for smooth updates

//     return () => clearInterval(interval);
//   }, [currentPlayer, players]);

//   // Rendering the canvas
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");

//     const render = () => {
//       if (!currentPlayer) return;

//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // Calculate the viewport offset
//       const viewportX = currentPlayer.x - canvas.width / 2;
//       const viewportY = currentPlayer.y - canvas.height / 2;
//       ctx.save();
//       ctx.translate(-viewportX, -viewportY);

//       // Draw all players
//       players.forEach((player) => {
//         if (player.x && player.y) {
//           ctx.beginPath();
//           ctx.arc(player.x, player.y, player.size || 10, 0, Math.PI * 2);
//           ctx.fillStyle = player.color || "blue";
//           ctx.fill();
//           ctx.closePath();
//         }
//       });

//       // Draw all apples
//       apples.forEach((apple) => {
//         if (apple.x && apple.y && apple.size) {
//           ctx.beginPath();
//           ctx.arc(apple.x, apple.y, apple.size, 0, Math.PI * 2);
//           ctx.fillStyle = "red";
//           ctx.fill();
//           ctx.closePath();
//         }
//       });

//       ctx.restore();
//       requestAnimationFrame(render);
//     };

//     render();
//   }, [currentPlayer, players, apples]);

//   return (
//     <canvas
//       ref={canvasRef}
//       width={1000}
//       height={1000}
//       onMouseMove={movePlayer}
//       style={{ display: "block", margin: "auto", border: "1px solid black" }}
//     />
//   );
// };

// export default Game;
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
  const [lastSentPosition, setLastSentPosition] = useState({ x: 0, y: 0 });

  // Set up socket events on component mount
  useEffect(() => {
    socket.on(SocketEvents.GameState, (gameState) => {
      if (gameState) {
        setPlayers(gameState.players || []);
        setApples(gameState.apples || []);
      }
    });

    socket.on(SocketEvents.PlayerCreated, (playerData) => {
      if (playerData && playerData.id) {
        setCurrentPlayer(playerData);
      }
    });

    socket.on(SocketEvents.PlayerDisconnected, (playerId) => {
      setPlayers((prevPlayers) =>
        prevPlayers.filter((player) => player.id !== playerId)
      );
    });

    socket.emit(SocketEvents.CreatePlayer, "shaggy");

    const handleBeforeUnload = () => {
      socket.emit(SocketEvents.PlayerDisconnected);
      socket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off(SocketEvents.GameState);
      socket.off(SocketEvents.PlayerCreated);
      socket.off(SocketEvents.PlayerDisconnected);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Smooth Damping function
  // const smoothDamp = (current, target, velocity, smoothTime) => {
  //   const omega = 2.0 / smoothTime;
  //   const x = omega * current;
  //   const delta = target - current;
  //   const temp = (delta + velocity) / omega;
  //   velocity = (x + temp) * 0.5;
  //   return target + velocity;
  // };

  // Interpolation for smooth rendering of other players' positions
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (currentPlayer && players) {
  //       const updatedPlayers = players.map((player) => {
  //         if (player.id !== currentPlayer.id) {
  //           const prevPosition = players.find((p) => p.id === player.id);
  //           if (prevPosition) {
  //             const smoothTime = 1; // Adjust for smoother or faster movement
  //             const velocityX = 0; // Optional: Calculate velocity for more advanced smooth damping
  //             const velocityY = 0;

  //             return {
  //               ...player,
  //               x: smoothDamp(prevPosition.x, player.x, velocityX, smoothTime),
  //               y: smoothDamp(prevPosition.y, player.y, velocityY, smoothTime),
  //             };
  //           }
  //         }
  //         return player;
  //       });

  //       setPlayers(updatedPlayers);
  //     }
  //   }, 50); // Update every 50ms for smoother motion

  //   return () => clearInterval(interval);
  // }, [currentPlayer, players]);

  // Handle mouse movement for player control
  const movePlayer = throttle((e) => {
    if (!currentPlayer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvas.width / 2;
    const mouseY = e.clientY - rect.top - canvas.height / 2;

    const speed = 2; // Adjust as needed
    const predictedX = currentPlayer.x + mouseX * 0.01 * speed;
    const predictedY = currentPlayer.y + mouseY * 0.01 * speed;

    if (
      predictedX !== lastSentPosition.x ||
      predictedY !== lastSentPosition.y
    ) {
      setCurrentPlayer((prev) => ({ ...prev, x: predictedX, y: predictedY }));
      setLastSentPosition({ x: predictedX, y: predictedY });

      socket.emit(SocketEvents.UpdatePlayerPosition, predictedX, predictedY);
    }
  }, 200);

  // Rendering the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const render = () => {
      if (!currentPlayer) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate the viewport offset
      const viewportX = currentPlayer.x - canvas.width / 2;
      const viewportY = currentPlayer.y - canvas.height / 2;
      ctx.save();
      ctx.translate(-viewportX, -viewportY);

      // Draw all players
      players.forEach((player) => {
        if (player.x && player.y) {
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.size || 10, 0, Math.PI * 2);
          ctx.fillStyle = player.color || "blue";
          ctx.fill();
          ctx.closePath();
        }
      });

      // Draw all apples
      apples.forEach((apple) => {
        if (apple.x && apple.y && apple.size) {
          ctx.beginPath();
          ctx.arc(apple.x, apple.y, apple.size, 0, Math.PI * 2);
          ctx.fillStyle = "red";
          ctx.fill();
          ctx.closePath();
        }
      });

      ctx.restore();
      requestAnimationFrame(render);
    };

    render();
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
