// import { Controller, Get } from '@nestjs/common';
// import { MailService } from './mail.service';
// import { MailerService } from '@nestjs-modules/mailer';
// import { Public, ResponseMessage } from 'src/decorators/customize';
// import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
// import { InjectModel } from '@nestjs/mongoose';
// import { ApiTags } from '@nestjs/swagger';

// @ApiTags('mail')
// @Controller('mail')
// export class MailController {
//   constructor(private readonly mailService: MailService,
//   ) { }

//   @Get()
//   @Public()
//   @ResponseMessage("Test email")
//   async handleTestEmail() {
//     //const subscribers = await this.subscriberModel.find();

//     for (const subs of subscribers) {
//       const subsSkills = subs.skills;
//       const jobWithMatchingSkills = await this.jobModel.find({ skills: { $in: subsSkills } });
//       if (jobWithMatchingSkills.length) {

//         const jobs = jobWithMatchingSkills.map((item) => {
//           return {
//             name: item.name,
//             company: item.company,
//             salary: `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + " đ",
//             skills: item.skills
//           }
//         });
//         console.log("subs.email", subs.email);
//         await this.mailerService.sendMail({
//           to: subs.email,
//           from: '"Support Team" <support@example.com>', // override default from
//           subject: 'Welcome to Nice App! Confirm your Email',
//           template: "new-job", // Call to the template had config view engine
//           context: {
//             receiver: subs.name,
//             jobs: jobs
//           }
//         });
//       }
//     }
//   }
// }
