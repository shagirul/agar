import React, { useRef, useEffect, useState } from "react";

const CircleCanvasTwo = () => {
  const canvasRef = useRef(null);
  const [circles, setCircles] = useState([
    {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      size: 20, // Circle size
      cooldown: 0, // Cooldown timer in seconds
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
      ctx.fillStyle = circle.cooldown > 0 ? "orange" : "blue"; // Orange indicates cooldown
      ctx.fill();
      ctx.closePath();

      // Draw the cooldown text inside the circle
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(circle.cooldown.toFixed(1), circle.x, circle.y); // Show cooldown with one decimal place
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

  const updateCooldowns = () => {
    setCircles((prevCircles) =>
      prevCircles.map((circle) => ({
        ...circle,
        cooldown: Math.max(0, circle.cooldown - 1 / 60), // Decrease cooldown (1 frame = 1/60 sec)
      }))
    );
  };

  const moveCirclesTowards = (mouseX, mouseY) => {
    setCircles((prevCircles) =>
      prevCircles.map((circle) => {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

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
      })
    );

    checkForMerges();
  };

  const checkForMerges = () => {
    setCircles((prevCircles) => {
      const merged = [];

      for (let i = 0; i < prevCircles.length; i++) {
        let mergedCircle = prevCircles[i];

        for (let j = i + 1; j < prevCircles.length; j++) {
          const circle1 = mergedCircle;
          const circle2 = prevCircles[j];

          const dx = circle2.x - circle1.x;
          const dy = circle2.y - circle1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Check if both circles are ready to merge (cooldown must be zero)
          if (
            distance < circle1.size + circle2.size &&
            circle1.cooldown <= 0 &&
            circle2.cooldown <= 0
          ) {
            // Merge the circles
            mergedCircle = {
              x: (circle1.x + circle2.x) / 2,
              y: (circle1.y + circle2.y) / 2,
              size: circle1.size + circle2.size,
              cooldown: Math.max(10, 30 + 0.02 * (circle1.size + circle2.size)), // Ensure cooldown is at least 10 sec
            };

            prevCircles.splice(j, 1); // Remove merged circle
          }
        }

        merged.push(mergedCircle);
      }

      // Ensure no overlap after merge (check distances)
      for (let i = 0; i < merged.length; i++) {
        for (let j = i + 1; j < merged.length; j++) {
          const dx = merged[j].x - merged[i].x;
          const dy = merged[j].y - merged[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = merged[i].size + merged[j].size + 10; // minimum space between merged circles

          // If they are too close, push them apart
          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx);
            const offset = minDistance - distance;

            merged[j].x += (Math.cos(angle) * offset) / 2;
            merged[j].y += (Math.sin(angle) * offset) / 2;
            merged[i].x -= (Math.cos(angle) * offset) / 2;
            merged[i].y -= (Math.sin(angle) * offset) / 2;
          }
        }
      }

      return merged;
    });
  };

  const detectCollision = () => {
    circles.forEach((circle, index) => {
      const dx = circle.x - applePosition.x;
      const dy = circle.y - applePosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < circle.size + 10 && isAppleVisible) {
        setIsAppleVisible(false);

        setCircles((prev) =>
          prev.map((c, i) =>
            i === index
              ? {
                  ...c,
                  size: c.size + 5,
                  cooldown: Math.max(10, 30 + 0.2 * c.size), // Set cooldown after growth with min 10 sec
                }
              : c
          )
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
      setCircles((prevCircles) =>
        prevCircles.flatMap((circle) => {
          const halfSize = circle.size / 2;
          const offset = circle.size + 15;
          if (halfSize < 5) return [circle];

          // Ensure split circles don't overlap by using dynamic offset
          const splitOffset = offset * 1.5;

          return [
            {
              ...circle,
              size: halfSize,
              x: circle.x - splitOffset,
              y: circle.y - splitOffset,
              cooldown: Math.max(10, 30 + 0.02 * halfSize), // Ensure cooldown is at least 10 sec
            },
            {
              ...circle,
              size: halfSize,
              x: circle.x + splitOffset,
              y: circle.y + splitOffset,
              cooldown: Math.max(10, 30 + 0.02 * halfSize), // Ensure cooldown is at least 10 sec
            },
          ];
        })
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      drawCircles(ctx);
      updateCooldowns();
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
