const passwordValidator = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      error: 'Password is required and must satisfy the validation rules.'
    });
  }

  const rules = [
    { regex: /^.{8,}$/, message: 'At least 8 characters.' },
    { regex: /[A-Z]/, message: 'At least one uppercase letter.' },
    { regex: /[a-z]/, message: 'At least one lowercase letter.' },
    { regex: /[!@#$%^&*()_+\-=[\]{};:\"\\|,.<>/?]/, message: 'At least one special character (!@#$%^&*).'}
  ];

  const failedRules = rules.filter(rule => !rule.regex.test(password));

  if (failedRules.length > 0) {
    return res.status(400).json({
      error: 'Invalid password.',
      rules: failedRules.map(rule => rule.message)
    });
  }

  next();
};

module.exports = passwordValidator;
