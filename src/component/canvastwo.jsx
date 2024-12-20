import React, { useRef, useEffect, useState } from "react";

const CircleCanvasTwo = () => {
  const canvasRef = useRef(null);
  const [circles, setCircles] = useState([
    {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      size: 20, // Circle size
    },
  ]);
  const [applePosition, setApplePosition] = useState({
    x: Math.floor(Math.random() * window.innerWidth),
    y: Math.floor(Math.random() * window.innerHeight),
  });
  const [isAppleVisible, setIsAppleVisible] = useState(true);

  let animationFrameId;

  const drawCircles = (ctx) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw the border
    ctx.beginPath();
    ctx.rect(0, 0, window.innerWidth, window.innerHeight);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.closePath();

    // Draw all circles
    circles.forEach((circle) => {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.size, 0, Math.PI * 2);
      ctx.fillStyle = "blue";
      ctx.fill();
      ctx.closePath();
    });

    // Draw the apple if visible
    if (isAppleVisible) {
      ctx.beginPath();
      ctx.arc(applePosition.x, applePosition.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.closePath();
    }
  };

  const moveCirclesTowards = (mouseX, mouseY) => {
    const buffer = 5; // Extra buffer to prevent visual overlap

    setCircles((prevCircles) => {
      const updatedCircles = prevCircles.map((circle) => {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate speed based on circle size
        const maxSpeed = 10;
        const minSpeed = 1;
        const sizeFactor = 40;
        const speed = Math.max(minSpeed, maxSpeed - circle.size / sizeFactor);

        if (distance < 1) return circle;

        const angle = Math.atan2(dy, dx);
        return {
          ...circle,
          x: circle.x + Math.cos(angle) * Math.min(speed, distance),
          y: circle.y + Math.sin(angle) * Math.min(speed, distance),
        };
      });

      // Apply dynamic offset to avoid overlapping
      for (let i = 0; i < updatedCircles.length; i++) {
        for (let j = i + 1; j < updatedCircles.length; j++) {
          const dx = updatedCircles[j].x - updatedCircles[i].x;
          const dy = updatedCircles[j].y - updatedCircles[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate dynamic offset based on sizes
          const dynamicOffset =
            updatedCircles[i].size + updatedCircles[j].size + buffer;

          if (distance < dynamicOffset) {
            const overlap = dynamicOffset - distance;
            const angle = Math.atan2(dy, dx);

            // Push the circles away from each other
            updatedCircles[i].x -= (Math.cos(angle) * overlap) / 2;
            updatedCircles[i].y -= (Math.sin(angle) * overlap) / 2;
            updatedCircles[j].x += (Math.cos(angle) * overlap) / 2;
            updatedCircles[j].y += (Math.sin(angle) * overlap) / 2;
          }
        }
      }

      return updatedCircles;
    });
  };

  const detectCollision = () => {
    circles.forEach((circle, index) => {
      const dx = circle.x - applePosition.x;
      const dy = circle.y - applePosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < circle.size + 10 && isAppleVisible) {
        setIsAppleVisible(false);

        // Increase the size of the first circle that collides
        setCircles((prev) =>
          prev.map((c, i) => (i === index ? { ...c, size: c.size + 5 } : c))
        );

        setTimeout(() => {
          const newApplePosition = {
            x: Math.floor(Math.random() * window.innerWidth),
            y: Math.floor(Math.random() * window.innerHeight),
          };
          setApplePosition(newApplePosition);
          setIsAppleVisible(true);
        }, 500);
      }
    });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const animate = () => {
      moveCirclesTowards(mouseX, mouseY);
      animationFrameId = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animate);
  };

  const handleKeyPress = (e) => {
    if (e.code === "Space") {
      setCircles((prevCircles) => {
        return prevCircles.flatMap((circle) => {
          const halfSize = circle.size / 2;
          const offset = circle.size + 15;
          if (halfSize < 5) return [circle];

          return [
            {
              ...circle,
              size: halfSize,
              x: circle.x - offset,
              y: circle.y - offset,
            },
            {
              ...circle,
              size: halfSize,
              x: circle.x + offset,
              y: circle.y + offset,
            },
          ];
        });
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      drawCircles(ctx);
      detectCollision();
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [circles, applePosition, isAppleVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

export default CircleCanvasTwo;
