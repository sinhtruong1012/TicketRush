/**
 * useFormValidation — Real-time field-level validation hook
 * Returns: { errors, touched, validate, validateField, isValid, touchField }
 */

import { useState, useCallback, useMemo } from 'react';

const RULES = {
  required: (v) => (!v || !v.toString().trim()) ? 'Trường này là bắt buộc' : '',
  email: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email không hợp lệ' : '',
  phone: (v) => {
    if (!v) return '';
    const digits = v.replace(/\D/g, '');
    if (digits.length > 0 && (digits.length < 9 || digits.length > 11)) return 'Số điện thoại từ 9-11 số';
    if (digits.length > 0 && !/^0/.test(digits)) return 'Số điện thoại phải bắt đầu bằng 0';
    return '';
  },
  minLength: (min) => (v) => v && v.length < min ? `Tối thiểu ${min} ký tự` : '',
  hasUpper: (v) => v && !/[A-Z]/.test(v) ? 'Cần ít nhất 1 chữ hoa' : '',
  hasLower: (v) => v && !/[a-z]/.test(v) ? 'Cần ít nhất 1 chữ thường' : '',
  hasNumber: (v) => v && !/[0-9]/.test(v) ? 'Cần ít nhất 1 chữ số' : '',
  hasSpecial: (v) => v && !/[!@#$%^&*(),.?":{}|<>_-]/.test(v) ? 'Cần ít nhất 1 ký tự đặc biệt' : '',
  url: (v) => {
    if (!v) return '';
    try { new URL(v); return ''; } catch { return 'URL không hợp lệ'; }
  },
  futureDate: (v) => {
    if (!v) return '';
    return new Date(v) <= new Date() ? 'Ngày phải ở tương lai' : '';
  },
};

export function useFormValidation(schema) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((field, value) => {
    const fieldRules = schema[field];
    if (!fieldRules) return '';

    for (const rule of fieldRules) {
      const msg = typeof rule === 'function' ? rule(value) : '';
      if (msg) return msg;
    }
    return '';
  }, [schema]);

  const touchField = useCallback((field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const msg = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: msg }));
  }, [validateField]);

  const validate = useCallback((formData) => {
    const newErrors = {};
    const allTouched = {};
    let valid = true;

    for (const field of Object.keys(schema)) {
      allTouched[field] = true;
      const msg = validateField(field, formData[field]);
      newErrors[field] = msg;
      if (msg) valid = false;
    }

    setErrors(newErrors);
    setTouched(allTouched);
    return valid;
  }, [schema, validateField]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(e => !e);
  }, [errors]);

  return { errors, touched, validate, validateField, touchField, isValid };
}

export { RULES };
