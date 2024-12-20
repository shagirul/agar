import React, { useRef, useEffect, useState } from "react";

const CircleCanvasTwo = () => {
  const canvasRef = useRef(null);
  const speedRef = useRef(10); // useRef for speed instead of useState
  const [circlePosition, setCirclePosition] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const [applePosition, setApplePosition] = useState({
    x: Math.floor(Math.random() * window.innerWidth),
    y: Math.floor(Math.random() * window.innerHeight),
  });
  const [isAppleVisible, setIsAppleVisible] = useState(true); // Track apple visibility
  const [circleSize, setCircleSize] = useState(20);

  let animationFrameId; // Declare the animation frame ID

  const drawCircle = (ctx, x, y) => {
    // Clear the canvas
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw the border
    ctx.beginPath();
    ctx.rect(0, 0, window.innerWidth, window.innerHeight);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.closePath();

    // Draw the main circle
    ctx.beginPath();
    ctx.arc(x, y, circleSize, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();
  };

  const moveCircleTowards = (mouseX, mouseY) => {
    setCirclePosition((prev) => {
      const dx = mouseX - prev.x;
      const dy = mouseY - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Use the speed stored in the ref directly
      const updatedSpeed = Math.min(
        distance / (10 + Math.pow(circleSize, 1.5) / 100),
        speedRef.current
      );
      console.log(updatedSpeed); // Log current speed
      if (distance < 1) return prev; // Stop moving when very close

      const angle = Math.atan2(dy, dx);
      return {
        x: prev.x + Math.cos(angle) * updatedSpeed,
        y: prev.y + Math.sin(angle) * updatedSpeed,
      };
    });
  };

  const detectCollision = () => {
    const dx = circlePosition.x - applePosition.x;
    const dy = circlePosition.y - applePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < circleSize + 10 && isAppleVisible) {
      console.log("collision detected");

      // Hide the apple immediately
      setIsAppleVisible(false);

      // Increase the circle size
      setCircleSize((prev) => prev + 5);

      // Decrease the speed using the ref
      speedRef.current = Math.max(speedRef.current - 1, 1); // Ensure the speed doesn't go below 1

      // Respawn the apple after a short delay
      setTimeout(() => {
        const newApplePosition = {
          x: Math.floor(Math.random() * window.innerWidth),
          y: Math.floor(Math.random() * window.innerHeight),
        };
        setApplePosition(newApplePosition);
        setIsAppleVisible(true); // Make the apple visible again
      }, 500); // Delay for respawning (500ms)
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const animate = () => {
      moveCircleTowards(mouseX, mouseY);
      animationFrameId = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCircle(ctx, circlePosition.x, circlePosition.y);

      // Draw the apple if it's visible
      if (isAppleVisible) {
        ctx.beginPath();
        ctx.arc(applePosition.x, applePosition.y, 10, 0, Math.PI * 2); // Draw apple with fixed size
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();
      }

      // Detect collision
      detectCollision();
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [circlePosition, applePosition, isAppleVisible, circleSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

export default CircleCanvasTwo;
