export const Logo = `
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                cursor: pointer;
                margin-top: 20px;
                width:100%;
              "
            >
              <img src="cid:unique@talentnest" class="img-div" />
      
              <div style="font-weight: 700; font-size: 24px; display: flex; gap: 0">
                <span style="color: black">Talent</span>
                <span style="color: #001354">Nest</span>
              </div>
            </div>
`;

export const logoAttachment = {
  filename: "logo.png",
  path: "./logo.png",
  cid: `unique@talentnest`,
};

export const defaultStylesClass = `
              body {
                margin: 0;
              }
              .container {
                font-family: Arial, sans-serif;
              }
              .header {
                width: 100%;
                height: 60px;
                background: linear-gradient(135deg, #010d3e, #001354);
              }
              .img-div {
                width: 40px;
                height: 40px;
              }
`;

export const closingElement = `
               <p style="font-size: 16px;">
                 Best regards,<br />
                 <span
                   style="
                     font-weight: bold;
                     margin-top: 10px;
                   "
                 >
                   Talent<span style="color: #010d3e">Nest</span>
                 </span>
               </p>
`;
