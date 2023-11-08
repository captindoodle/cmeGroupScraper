async function sendEmailWithCSV(csvFilePath) {
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "captindoodle@gmail.com",
        pass: "zqqn pnie iuot lups",
      },
    });
  
    let info = await transporter.sendMail({
      from: `"cmeGroupBot" <${"captindoodle@gmail.com"}>`,
      to: "abidan.carver@deercreeks.org",
      subject: "Scraped Data",
      text: "Here is the scraped data.",
      attachments: [
        {
          path: csvFilePath,
        },
      ],
    });
  
    console.log("Message sent: %s", info.messageId);
  }

