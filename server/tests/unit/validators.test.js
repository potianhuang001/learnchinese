/**
 * 单元测试：输入验证器
 * 覆盖 validate 的核心规则以及全部 is* 断言函数。
 */
const {
  validate,
  isEmail,
  isUsername,
  isPassword,
  isObjectId,
  isLevel,
  isQuestionType,
  isBoolean,
  isNumber,
  isArrayOfStrings,
  isUrl,
} = require('../../src/utils/validators');

describe('validators', () => {
  describe('isEmail', () => {
    test('合法邮箱通过', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('a.b+c@sub.domain.io')).toBe(true);
    });
    test('非法邮箱拒绝', () => {
      expect(isEmail('plainaddress')).toBe(false);
      expect(isEmail('a@b')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail(123)).toBe(false);
      expect(isEmail('')).toBe(false);
    });
  });

  describe('isUsername', () => {
    test('3-30 位字母数字下划线通过', () => {
      expect(isUsername('abc')).toBe(true);
      expect(isUsername('user_123')).toBe(true);
      expect(isUsername('A'.repeat(30))).toBe(true);
    });
    test('非法用户名拒绝', () => {
      expect(isUsername('ab')).toBe(false); // 太短
      expect(isUsername('a'.repeat(31))).toBe(false); // 太长
      expect(isUsername('bad name')).toBe(false); // 含空格
      expect(isUsername('中文')).toBe(false); // 非 ASCII
      expect(isUsername('')).toBe(false);
    });
  });

  describe('isPassword', () => {
    test('长度 >= 8 通过', () => {
      expect(isPassword('12345678')).toBe(true);
      expect(isPassword('passw0rd!')).toBe(true);
    });
    test('长度不足拒绝', () => {
      expect(isPassword('short')).toBe(false);
      expect(isPassword('')).toBe(false);
      expect(isPassword(12345678)).toBe(false);
    });
  });

  describe('isObjectId', () => {
    test('24 位十六进制通过', () => {
      expect(isObjectId('64b1f2c3d4e5f6a7b8c9d0e1')).toBe(true);
      expect(isObjectId('64B1F2C3D4E5F6A7B8C9D0E1')).toBe(true);
    });
    test('非法 ObjectId 拒绝', () => {
      expect(isObjectId('not-an-id')).toBe(false);
      expect(isObjectId('64b1f2c3')).toBe(false); // 长度不足
      expect(isObjectId('')).toBe(false);
      expect(isObjectId(undefined)).toBe(false);
    });
  });

  describe('isLevel', () => {
    test('三种难度通过', () => {
      expect(isLevel('beginner')).toBe(true);
      expect(isLevel('intermediate')).toBe(true);
      expect(isLevel('advanced')).toBe(true);
    });
    test('其他值拒绝', () => {
      expect(isLevel('expert')).toBe(false);
      expect(isLevel('')).toBe(false);
    });
  });

  describe('isQuestionType', () => {
    test('三种题型通过', () => {
      expect(isQuestionType('multiple_choice')).toBe(true);
      expect(isQuestionType('fill_blank')).toBe(true);
      expect(isQuestionType('listening')).toBe(true);
    });
    test('其他值拒绝', () => {
      expect(isQuestionType('essay')).toBe(false);
      expect(isQuestionType('')).toBe(false);
    });
  });

  describe('isBoolean / isNumber', () => {
    test('布尔判断', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(1)).toBe(false);
    });
    test('数字判断', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(100)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('10')).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
    });
  });

  describe('isArrayOfStrings / isUrl', () => {
    test('字符串数组', () => {
      expect(isArrayOfStrings(['a', 'b'])).toBe(true);
      expect(isArrayOfStrings([])).toBe(true);
      expect(isArrayOfStrings(['a', 1])).toBe(false);
      expect(isArrayOfStrings('a')).toBe(false);
    });
    test('URL 判断（空串允许，视为可选字段）', () => {
      expect(isUrl('https://example.com/audio.mp3')).toBe(true);
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('')).toBe(true);
      expect(isUrl('ftp://x.com')).toBe(false);
      expect(isUrl('not-a-url')).toBe(false);
    });
  });

  describe('validate', () => {
    const schema = {
      email: { required: true, test: isEmail, message: 'Valid email is required' },
      password: {
        required: true,
        test: isPassword,
        message: 'Password must be at least 8 characters',
      },
      age: { test: isNumber, message: 'age must be a number' },
    };

    test('全部合法返回 ok:true', () => {
      const r = validate({ email: 'a@b.com', password: '12345678', age: 20 }, schema);
      expect(r).toEqual({ ok: true });
    });

    test('缺必填字段返回 errors', () => {
      const r = validate({}, schema);
      expect(r.ok).toBe(false);
      expect(r.errors.email).toBe('Valid email is required');
      expect(r.errors.password).toBe('Password must be at least 8 characters');
    });

    test('必填字段为空字符串视为缺失', () => {
      const r = validate({ email: '', password: '12345678' }, schema);
      expect(r.ok).toBe(false);
      expect(r.errors.email).toBeDefined();
    });

    test('可选字段不传不报错', () => {
      const r = validate({ email: 'a@b.com', password: '12345678' }, schema);
      expect(r.ok).toBe(true);
    });

    test('可选字段传错类型报错', () => {
      const r = validate({ email: 'a@b.com', password: '12345678', age: 'twenty' }, schema);
      expect(r.ok).toBe(false);
      expect(r.errors.age).toBe('age must be a number');
    });

    test('body 为 undefined 不抛异常', () => {
      expect(() => validate(undefined, schema)).not.toThrow();
      const r = validate(undefined, schema);
      expect(r.ok).toBe(false);
    });
  });
});
