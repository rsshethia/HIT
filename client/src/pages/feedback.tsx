import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Send, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';

const feedbackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  category: z.enum(['bug', 'feature', 'improvement', 'question', 'other'], {
    required_error: 'Please select a feedback category'
  }),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      category: 'other' as const,
      subject: '',
      message: '',
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackForm) => {
      // Create a mailto link with the feedback content
      const subject = `HIT Feedback: ${data.category.toUpperCase()} - ${data.subject}`;
      const body = `Name: ${data.name}
Email: ${data.email}
Category: ${data.category}

Message:
${data.message}

---
Sent from Health Integration Tools (HIT)`;

      const mailtoLink = `mailto:rsshethia@gmail.com?cc=${encodeURIComponent(data.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open the user's default email client
      window.location.href = mailtoLink;
      
      // Simulate success after a short delay
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1000);
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Email client opened!",
        description: "Your feedback email has been prepared. Please send it from your email client.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send feedback",
        description: error.message || "There was an error sending your feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackForm) => {
    submitFeedbackMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Ready!</h2>
            <p className="text-gray-600 mb-6">
              Your feedback email has been prepared and should open in your default email client. 
              Please review and send the email to complete your feedback submission.
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              className="w-full"
            >
              Send Another Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">We'd Love Your Feedback</h1>
          <p className="text-lg text-gray-600">
            Help us improve Health Integration Tools (HIT) by sharing your thoughts, suggestions, or reporting issues.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Feedback
            </CardTitle>
            <CardDescription>
              Your feedback is important to us. We read every message and use your input to make HIT better.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input 
                    {...form.register('name')}
                    placeholder="Your full name"
                    className={form.formState.errors.name ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input 
                    {...form.register('email')}
                    type="email"
                    placeholder="your.email@example.com"
                    className={form.formState.errors.email ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Category</label>
                <select 
                  {...form.register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bug">🐛 Bug Report</option>
                  <option value="feature">💡 Feature Request</option>
                  <option value="improvement">⚡ Improvement Suggestion</option>
                  <option value="question">❓ Question</option>
                  <option value="other">💬 Other</option>
                </select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input 
                  {...form.register('subject')}
                  placeholder="Brief description of your feedback"
                  className={form.formState.errors.subject ? 'border-red-500' : ''}
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <Textarea 
                  {...form.register('message')}
                  placeholder="Please provide detailed feedback. If reporting a bug, include steps to reproduce it."
                  className={`min-h-[120px] ${form.formState.errors.message ? 'border-red-500' : ''}`}
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.message.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Privacy Notice</p>
                    <p>
                      Your email address will only be used to respond to your feedback if necessary. 
                      We do not share your information with third parties or use it for marketing purposes.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitFeedbackMutation.isPending}
              >
                {submitFeedbackMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Professional Support</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your feedback is sent to our development team at <strong>rsshethia@gmail.com</strong> with a copy sent to your email for confirmation.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-blue-800">
              <span>✓ Secure submission</span>
              <span>✓ Confirmation copy to you</span>
              <span>✓ 24-48 hour response</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}