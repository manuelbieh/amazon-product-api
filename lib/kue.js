import kue from 'kue';
export default kue;
export const queue = kue.createQueue({
  prefix: 'q',
  redis: {
    port: 6379,
    host: '139.59.209.211',
    auth: 'uiweruiovuiv785jkjkgiof9gjuidfuifui',
    db: 4
  }
});
