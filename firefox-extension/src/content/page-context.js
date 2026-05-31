(function () {
  'use strict';

  function getVisibleFormFields() {
    const fields = [];
    const formElements = document.querySelectorAll('input, select, textarea, [role="combobox"], [role="listbox"]');

    formElements.forEach(function (el) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      let label = '';
      if (el.labels && el.labels.length > 0) {
        label = el.labels[0].textContent.trim();
      } else if (el.id) {
        const labelEl = document.querySelector('label[for="' + el.id + '"]');
        if (labelEl) label = labelEl.textContent.trim();
      } else if (el.getAttribute('aria-label')) {
        label = el.getAttribute('aria-label');
      } else if (el.getAttribute('placeholder')) {
        label = el.getAttribute('placeholder');
      }

      const parent = el.closest('.form-item, .el-form-item, .ant-form-item, .arco-form-item, .form-group, .field, [class*="form"]');
      if (!label && parent) {
        const labelInParent = parent.querySelector('label, .label, .el-form-item__label, .ant-form-item-label, [class*="label"]');
        if (labelInParent) label = labelInParent.textContent.trim();
      }

      fields.push({
        tagName: el.tagName.toLowerCase(),
        type: el.type || '',
        name: el.name || '',
        id: el.id || '',
        placeholder: el.placeholder || '',
        label: label,
        required: el.required || el.getAttribute('aria-required') === 'true',
      });
    });

    return fields;
  }

  var result = {
    url: window.location.href,
    title: document.title,
    formFields: getVisibleFormFields(),
  };

  try {
    chrome.runtime.sendMessage({
      type: 'PAGE_CONTEXT_RESULT',
      data: result,
    });
  } catch (e) {
    // Content script might not have messaging capability
  }

  return result;
})();
