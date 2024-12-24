// import React, { useRef, useEffect, useState } from "react";

// const CircleCanvas = () => {
//   const canvasRef = useRef(null);
//   const [circlePosition, setCirclePosition] = useState({
//     x: window.innerWidth / 2,
//     y: window.innerHeight / 2,
//   });
//   const circleRadius = 20;
//   let animationFrameId;

//   const drawCircle = (ctx, x, y) => {
//     // Clear the canvas
//     ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

//     // Draw the border
//     ctx.beginPath();
//     ctx.rect(0, 0, window.innerWidth, window.innerHeight);
//     ctx.strokeStyle = "black";
//     ctx.lineWidth = 5;
//     ctx.stroke();
//     ctx.closePath();

//     // Draw the main circle
//     ctx.beginPath();
//     ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
//     ctx.fillStyle = "blue";
//     ctx.fill();
//     ctx.closePath();
//   };

//   const moveCircleTowards = (mouseX, mouseY) => {
//     setCirclePosition((prev) => {
//       const dx = mouseX - prev.x;
//       const dy = mouseY - prev.y;
//       const distance = Math.sqrt(dx * dx + dy * dy);
//       const speed = Math.min(distance / 10, 10); // Speed increases with distance but is capped

//       if (distance < 1) return prev; // Stop moving when very close

//       const angle = Math.atan2(dy, dx);
//       return {
//         x: prev.x + Math.cos(angle) * speed,
//         y: prev.y + Math.sin(angle) * speed,
//       };
//     });
//   };

//   const handleMouseMove = (e) => {
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const mouseX = e.clientX - rect.left;
//     const mouseY = e.clientY - rect.top;

//     const animate = () => {
//       moveCircleTowards(mouseX, mouseY);
//       animationFrameId = requestAnimationFrame(animate);
//     };
//     cancelAnimationFrame(animationFrameId);
//     animationFrameId = requestAnimationFrame(animate);
//   };

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;

//     const render = () => {
//       drawCircle(ctx, circlePosition.x, circlePosition.y);
//       requestAnimationFrame(render);
//     };
//     render();

//     return () => cancelAnimationFrame(animationFrameId);
//   }, [circlePosition]);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     canvas.addEventListener("mousemove", handleMouseMove);

//     return () => {
//       canvas.removeEventListener("mousemove", handleMouseMove);
//     };
//   }, []);

//   return <canvas ref={canvasRef} style={{ display: "block" }} />;
// };

// export default CircleCanvas;
