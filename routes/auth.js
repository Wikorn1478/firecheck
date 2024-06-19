const express = require("express");
const router = express.Router();
const connection = require("../database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const moment = require("moment");

// Home page
router.get("/", (req, res) => {
  res.render("index");
});

// About page
router.get("/about", (req, res) => {
  res.render("about");
});

// Contact page
router.get("/contact", (req, res) => {
  res.render("contact");
});

// Login page
router.get("/login", (req, res) => {
  res.render("login");
});

// Register page for general users and admin
router.get("/register", (req, res) => {
  res.render("register", { isAdmin: req.query.role === "admin" });
});

// Generate a secure invite link for admin registration
router.get("/admin_invite", (req, res) => {
  if (req.session.user && req.session.user.role === "เจ้าหน้าที่") {
    const inviteToken = crypto.randomBytes(20).toString("hex");

    const query = "INSERT INTO admin_invites (token, created_at) VALUES (?, NOW())";
    connection.query(query, [inviteToken], (err, results) => {
      if (err) {
        console.error("Error generating invite:", err);
        return res.status(500).send("Error generating invite.");
      }

      const inviteLink = `${req.protocol}://${req.get("host")}/admin_register/${inviteToken}`;
      res.render("admin_invite", { inviteLink });
    });
  } else {
    res.status(403).send("Access denied. Admins only.");
  }
});

// Admin registration page with token validation
router.get("/admin_register/:token", (req, res) => {
  const { token } = req.params;

  const query = "SELECT * FROM admin_invites WHERE token = ? AND created_at > NOW() - INTERVAL 1 DAY";
  connection.query(query, [token], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).send("Invalid or expired invite token.");
    }

    res.render("admin_register", { isAdmin: true });
  });
});

// Log out route
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/");
  });
});

// Burning page
router.get("/burning", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  res.render("burning", { user: req.session.user });
});

// Burning advice page
router.get("/burning_advice", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  res.render("burning_advice", { user: req.session.user });
});

// Login form handling
router.post("/login_process", (req, res) => {
  const { identifier, password } = req.body;
  const query = "SELECT * FROM users WHERE User_Username = ? OR Email = ?";
  connection.query(query, [identifier, identifier], async (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.send("Error logging in.");
    }
    if (results.length === 0) {
      return res.send("No user found with the provided username/email.");
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.User_Password);

    if (!isMatch) {
      return res.send("Incorrect password.");
    }

    // Save user information to session
    req.session.user = {
      id: user.User_ID,
      username: user.User_Username,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      role: user.Role,
    };

    // Redirect to admin dashboard if the user is an admin
    if (user.Role === "เจ้าหน้าที่") {
      return res.redirect("/admin_dashboard");
    }

    // Redirect to /login_process
    res.redirect("/login_process");
  });
});

// Handling /login_process page
router.get("/login_process", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  // Render login_process page with user information
  res.render("login_process", { user: req.session.user });
});

// Register form handling for general users
router.post("/register_process", async (req, res) => {
  const { FirstName, LastName, User_Username, Email, User_Password } = req.body;
  const Role = "ผู้ใช้งานทั่วไป"; // Set default role to "ผู้ใช้งานทั่วไป"

  // Hash the password
  const hashedPassword = await bcrypt.hash(User_Password, 10);

  // Insert user into the database
  const query = "INSERT INTO users (FirstName, LastName, User_Username, Email, User_Password, Role) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(query, [FirstName, LastName, User_Username, Email, hashedPassword, Role], (err, results) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).send("Error registering user.");
    }
    console.log("User registered:", results);

    // Save user information to session
    req.session.user = {
      id: results.insertId,
      username: User_Username,
      firstName: FirstName,
      lastName: LastName,
      email: Email,
      role: Role,
    };

    // Redirect to /register_process
    res.redirect("/register_process");
  });
});

// Register form handling for admin users
router.post("/register_process_admin", async (req, res) => {
  const { FirstName, LastName, User_Username, Email, User_Password } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(User_Password, 10);

  // Insert user into the database
  const query = "INSERT INTO users (FirstName, LastName, User_Username, Email, User_Password, Role) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(query, [FirstName, LastName, User_Username, Email, hashedPassword, 'เจ้าหน้าที่'], (err, results) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).send("Error registering user.");
    }
    console.log("User registered:", results);

    // Save user information to session
    req.session.user = {
      id: results.insertId,
      username: User_Username,
      firstName: FirstName,
      lastName: LastName,
      email: Email,
      role: 'เจ้าหน้าที่',
    };

    // Redirect to admin dashboard
    res.redirect("/admin_dashboard");
  });
});

// Handling /register_process page
router.get("/register_process", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/register"); // Redirect to register if session is not found
  }

  // Render register_process page with user information
  res.render("register_process", { user: req.session.user });
});

// Handling burning request form submission
router.post("/submit-request", async (req, res) => {
  // const { latitude, longitude, 'burn-date': burnDate, 'burn-time': burnTime } = req.body;
  // const userId = req.session.user.id; // Use user ID from session
  // console.log('Received form data:', { userId, latitude, longitude, burnDate, burnTime });
  // const query = 'INSERT INTO request (User_ID, Latitude, Longitude, Burn_Date, Burn_Time) VALUES (?, ?, ?, ?, ?)';
  // console.log('Executing query:', query, [userId, latitude, longitude, burnDate, burnTime]);
  // connection.query(query, [userId, latitude, longitude, burnDate, burnTime], async (err, results) => {
  //     if (err) {
  //         console.error('Error inserting request:', err);
  //         return res.status(500).send('Error submitting request. Database error.');
  //     }
  //     try {
  //         const weatherData = await getWeatherForecast(latitude, longitude); // Fetch weather data
  //         if (!weatherData) {
  //             return res.status(500).send('Error fetching weather data.');
  //         }
  //         const burnDateMoment = moment(burnDate);
  //         const weatherList = weatherData.list.slice(0, 7).map((item, index) => ({
  //             date: burnDateMoment.clone().add(index, 'days').format('YYYY-MM-DD'),
  //             time: burnTime,
  //             description: item.weather[0].description,
  //             pressure: item.main.pressure,
  //             humidity: item.main.humidity,
  //             temp: item.main.temp,
  //             pm25: item.main.pm25, // Add PM2.5 data
  //             advice: item.weather[0].description.includes('clear') ? 'ควรเผา' : 'ไม่ควรเผา'
  //         }));
  //         // Insert each weather entry into the Weather table
  //         const weatherInsertQuery = `
  //             INSERT INTO Weather (Latitude, Longitude, Burn_DateTime, Pressure, Temperature, Humidity, PM2_5)
  //             VALUES (?, ?, ?, ?, ?, ?, ?)
  //         `;
  //         weatherList.forEach(weather => {
  //             const { date, time, pressure, temp, humidity, pm25 } = weather;
  //             const burnDateTime = `${date} ${time}`;
  //             connection.query(weatherInsertQuery, [latitude, longitude, burnDateTime, pressure, temp, humidity, pm25], (err, results) => {
  //                 if (err) {
  //                     console.error('Error inserting weather data:', err);
  //                     return res.status(500).send('Error inserting weather data.');
  //                 }
  //             });
  //         });
  //         res.render('submit_request', { user: req.session.user, weatherList, moment });
  //     } catch (error) {
  //         console.error('Error processing weather data:', error);
  //         return res.status(500).send('Error processing weather data.');
  //     }
  // });
});

// สำหรับการดีบักหรือเข้าถึงโดยตรง
router.get("/submit-request", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  const searchTerm = req.query.data;
  const apiResponse = JSON.parse(decodeURIComponent(searchTerm));

  const userId = req.session.user.id;

  const query =
    "INSERT INTO request (User_ID, Latitude, Longitude, Burn_Date, Burn_Time, PM2_5, Pressure, Humidity, Temperature, isRequest) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  apiResponse.data.forEach((element) => {
    const { date, time, pressure, temp, humidity } = element;
    const pm25 = element["pm2.5"];

    connection.query(
      query,
      [userId, apiResponse.lat, apiResponse.lon, date, time, pm25, pressure, humidity, temp, apiResponse.date == date ? 1 : 0],
      async (err, results) => {
        if (err) {
          console.error("Error inserting request:", err);
          return res
            .status(500)
            .send("Error submitting request. Database error.");
        }
      }
    );
  });

  res.render("submit_request", { user: req.session.user });
});

// History request page
router.get("/history_request", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  const userId = req.session.user.id; // Use user ID from session

  const query = "SELECT * FROM request WHERE User_ID = ? AND isRequest = ?";
  connection.query(query, [userId, 1], (err, results) => {
    if (err) {
      console.error("Error querying request history:", err);
      return res.status(500).send("Error retrieving request history.");
    }

    // ตรวจสอบข้อมูลก่อนการใช้งาน
    const formattedResults = results.map((request) => ({
      ...request,
      advice: request.advice || "ไม่มีคำแนะนำ", // Default to 'ไม่มีคำแนะนำ' if advice is not provided
    }));

    res.render("history_request", {
      user: req.session.user,
      requests: formattedResults,
      moment,
    }); // ส่ง moment ไปด้วย
  });
});

// Handle form submission for contact form
router.post("/submit-contact", (req, res) => {
  const { name, email, message } = req.body;
  const query = "INSERT INTO contact (name, email, message) VALUES (?, ?, ?)";
  connection.query(query, [name, email, message], (err, results) => {
    if (err) {
      console.error("Error submitting contact form:", err);
      return res.status(500).send("Error submitting contact form.");
    }
    console.log("Contact form submitted successfully");
    res.render("contact", { submitted: true }); // Render contact page with submitted flag
  });
});

router.get("/detail_request/:id", (req, res) => {
  console.log("Accessed detail_request route"); // ตรวจสอบว่าเส้นทางนี้ถูกเข้าถึง

  if (!req.session.user) {
    console.log("User not logged in"); // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
    return res.redirect("/login");
  }

  const requestId = req.params.id;
  console.log("Request ID:", requestId); // ตรวจสอบค่า requestId
  const query = "SELECT * FROM request WHERE id = ?";

  connection.query(query, [requestId], (err, results) => {
    if (err) {
      console.error("Error querying request details:", err);
      return res.status(500).send("Error retrieving request details.");
    }

    if (results.length === 0) {
      return res.status(404).send("Request not found.");
    }

    const request = results[0];
    res.render("detail_request", { user: req.session.user, request, moment });
  });
});

// Admin dashboard page
router.get("/admin_dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  if (req.session.user.role !== "เจ้าหน้าที่") {
    return res.status(403).send("Access denied"); // Restrict access if the user is not an admin
  }

  res.render("admin_dashboard", { user: req.session.user });
});

// History request admin page
router.get("/history_request_admin", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  if (req.session.user.role !== "เจ้าหน้าที่") {
    return res.status(403).send("Access denied"); // Restrict access if the user is not an admin
  }

  const query = `
        SELECT request.*, users.FirstName AS firstName, users.LastName AS lastName 
        FROM request 
        JOIN users ON request.User_ID = users.User_ID
    `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error querying request history:", err);
      return res.status(500).send("Error retrieving request history.");
    }

    const formattedResults = results.map((request) => ({
      ...request,
      firstName: request.firstName || "ไม่ระบุ", // กำหนดค่าเริ่มต้นหากไม่มีข้อมูล
      lastName: request.lastName || "ไม่ระบุ",
      advice: request.advice || "ไม่มีคำแนะนำ", // Default to 'ไม่มีคำแนะนำ' if advice is not provided
    }));

    res.render("history_request_admin", {
      user: req.session.user,
      requests: formattedResults,
      moment,
    }); // ส่ง moment ไปด้วย
  });
});

// User details page
router.get("/user_details/:id", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if session is not found
  }

  const requestId = req.params.id;
  const query = "SELECT * FROM request WHERE Request_Time = (Select Request_Time FROM request WHERE Request_ID = ?)";

  connection.query(query, [requestId], (err, results) => {
    if (err) {
      console.error("Error querying request details:", err);
      return res.status(500).send("Error retrieving request details.");
    }

    if (results.length === 0) {
      return res.status(404).send("Request not found.");
    }

    const requests = results;

    res.render("user_details", { user: req.session.user, requests, moment });
  });
});

// Admin details page
router.get("/admin_details/:id", (req, res) => {
  if (!req.session.user || req.session.user.role !== "เจ้าหน้าที่") {
    return res.redirect("/login"); // Redirect to login if session is not found or user is not admin
  }

  const requestId = req.params.id;
  const selectedDate = req.query.selectedDate; // Get selectedDate from query parameters

  const query = "SELECT * FROM request WHERE Request_Time = (SELECT Request_Time FROM request WHERE Request_ID = ?)";

  connection.query(query, [requestId], (err, results) => {
    if (err) {
      console.error("Error querying request details:", err);
      return res.status(500).send("Error retrieving request details.");
    }

    if (results.length === 0) {
      return res.status(404).send("Request not found.");
    }

    const requests = results;

    res.render("admin_details", { admin: req.session.user, requests, moment, selectedDate });
  });
});

module.exports = router;
