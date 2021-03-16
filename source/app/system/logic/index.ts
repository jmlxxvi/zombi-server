import config from "../../../core/config";
import log from "../../../core/log";

import path from "path";
import glob from "glob";

import nodemailer from "nodemailer";

export const modules_list = async () => {

    const files = glob.sync(__dirname + "/../../../api/**", {nodir: true});

    const base_path = path.normalize(__dirname + "../../../../api/" );

    const modules = [];

    for (let i = 0; i < files.length; i++) {

        modules.push(files[i].replace(base_path, "").replace("/index.js", "").replace(".js", ""));

    }

    return modules;

};

export const send_mail = async (from: string, to: string, subject: string, message: string, no_html_message = "Tu cliente de correo no admite HTML") => {

    // TODO make and abstraction out of this, like server/core/mail
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: config.security.notifications.email.user,
            pass: config.security.notifications.email.pass
        }
    });

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: no_html_message,
        html: message
    });

    log.info(`Message sent with id ${info.messageId}`, "mail/_send");

};
