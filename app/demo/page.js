"use client";
import React, { useEffect } from "react";

const DemoPage = () => {
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("http://localhost:8080/employees/1", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      console.log(response.data);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1>Demo Page</h1>
    </div>
  );
};

export default DemoPage;
