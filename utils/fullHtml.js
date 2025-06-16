import { closingElement, defaultStylesClass, Logo } from "./logo.js";

export const GenerateFullHtml = (html, jobRole, companyName) => {
  return `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .page-wrapper {
        height: 1123px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .header,
      .footer {
        width: 100%;
        height: 50px;
        background-color: #010d3e;
      }

      .logo img {
        width: 120px;
        margin-bottom: 20px;
      }
      .content {
        margin: 50px;
      }
    </style>
  </head>
  <body>
    <div class="page-wrapper">
      <div>
        <div class="header">
          <div
            style="
              font-weight: 700;
              font-size: 24px;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
            "
          >
            <span style="color: white">Talent</span>
            <span style="color: #cccccc">Nest</span>
          </div>
        </div>
        <div class="content" style="text-align: justify; line-height: 1.5">
          <p
            style="
              font-size: large;
              font-weight: bold;
              color: #010d3e;
              text-align: center;
            "
          >
            Offer Letter: ${jobRole} Position at ${companyName}
          </p>
         ${html}
        </div>
      </div>
      <div class="footer"></div>
    </div>
  </body>
</html>

    `;
};

export const GenerateDeclineHtml = (talentName, jobRole, companyName) =>
  `
         <!DOCTYPE html>
         <html>
           <head>
             <style>
                 ${defaultStylesClass}
             </style>
           </head>
           <body>
             <div class="container">
               <div class="header"></div>
                ${Logo}
               <div style="font-size: 16px; line-height: 1.5">
                 <p>
                   Dear ${talentName},<br />
                   We regret to inform you that we can no longer move forward with your application for the <strong>${jobRole}</strong> position at <strong>${companyName}</strong>.
                 </p>
                 <p>
                   Please know that this decision is not a reflection of your abilities or potential. We truly appreciate the time and effort you invested throughout the TalentNest hiring process.
                 </p>
                 <p>
                   We encourage you to continue applying for roles best suited to your strengths on our job board. We at <strong>TalentNest</strong> believe in your journey, and we sincerely hope that your next opportunity is just around the corner.
                 </p>
                 <p>
                   Wishing you all the best ahead.
                 </p>
               </div>

                ${closingElement}
               <div class="header"></div>
             </div>
           </body>
         </html>
  
        `;
