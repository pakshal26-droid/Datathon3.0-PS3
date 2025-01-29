import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/tickets/');
        const latestFaqs = response.data
          .slice(-5)
          .reverse()
          .map(ticket => ({
            question: ticket.description,
            answer: ticket.response
          }));
        setFaqs(latestFaqs);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };

    fetchFAQs();
  }, []);

  const toggleAnswer = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
           
            
          <div key={index} className="bg-white rounded-lg shadow-md">
            <button
              className="w-full text-left p-6 focus:outline-none flex justify-between items-center"
              onClick={() => toggleAnswer(index)}
            >
              <h3 className="text-lg font-semibold text-gray-800">Q: {faq.question}</h3>
              <svg
                className={`w-6 h-6 transform transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div
              className={`px-6 pb-6 transition-all duration-200 ease-in-out ${
                openIndex === index ? 'block opacity-100' : 'hidden opacity-0'
              }`}
            >
              <p className="text-gray-600">A: {faq.answer}</p>
            </div>
          </div>
          
        ))}
      </div>
    </div>
  );
};

export default FAQ;
