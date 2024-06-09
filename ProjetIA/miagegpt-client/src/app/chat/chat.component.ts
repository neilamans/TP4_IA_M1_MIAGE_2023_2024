import { Component, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../chat.service';

interface Message {
  role: string;
  content: string;
}

interface Chat {
  title: string;
  messages: Message[];
  images?: string[];
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewChecked {
  chats: Chat[] = [];
  filteredChats: Chat[] = [];
  currentChat?: Chat;
  isSidebarHidden = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(private chatService: ChatService) {
    this.filteredChats = this.chats; // Initialement, tous les chats sont affichés
  }

  ngAfterViewChecked() {
    this.scrollToBottom(); // Faire défiler jusqu'au bas après chaque changement de vue
  }

  sendMessage(content: string, role: string) {
    if (!this.currentChat) {
      const title = content.split(' ').slice(0, 2).join(' ');
      this.currentChat = { title, messages: [], images: [] };
      this.chats.push(this.currentChat);
      this.filteredChats = this.chats;
    }
    const message: Message = { role, content };
    this.currentChat.messages.push(message);

    if (content.startsWith('/')) {
      this.handleCommand(content);
    } else if (role === 'user') {
      this.chatService.sendMessage(content).subscribe(
        response => {
          const chatgptMessage: Message = { role: 'chatgpt', content: response.choices[0].message.content };
          this.currentChat?.messages.push(chatgptMessage);
          this.scrollToBottom(); // Faire défiler jusqu'au bas après avoir reçu une réponse
        },
        error => {
          console.error('Error:', error);
        }
      );
    }
    this.scrollToBottom(); // Faire défiler jusqu'au bas après avoir envoyé un message
  }

  handleCommand(content: string) {
    const command = content.split(' ')[0];
    const prompt = content.slice(command.length).trim();

    switch (command) {
      case '/image':
        this.generateImage(prompt);
        break;
      case '/speech':
        this.chatService.sendMessage(prompt).subscribe(
          response => {
            const chatgptMessage: Message = { role: 'chatgpt', content: response.choices[0].message.content };
            this.currentChat?.messages.push(chatgptMessage);
            this.speakText(response.choices[0].message.content);
            this.scrollToBottom(); // Faire défiler jusqu'au bas après avoir reçu une réponse
          },
          error => {
            console.error('Error:', error);
          }
        );
        break;
      default:
        console.warn('Commande inconnue:', command);
    }
  }

  onEnter(inputElement: HTMLInputElement) {
    const content = inputElement.value;
    if (content.trim()) {
      this.sendMessage(content, 'user');
      inputElement.value = '';
    }
  }

  generateImage(prompt: string) {
    if (!this.currentChat) {
      const title = prompt.split(' ').slice(0, 2).join(' ');
      this.currentChat = { title, messages: [], images: [] };
      this.chats.push(this.currentChat);
      this.filteredChats = this.chats;
    }

    const message: Message = { role: 'user', content: prompt };
    this.currentChat.messages.push(message);

    this.chatService.generateImage(prompt).subscribe(
      response => {
        const imageUrl = response.data[0].url;
        const imageMessage: Message = { role: 'image', content: imageUrl };
        this.currentChat?.messages.push(imageMessage);
        this.scrollToBottom(); // Faire défiler jusqu'au bas après avoir reçu une image
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  promptNewChat() {
    const title = prompt('Enter a title for the new chat:');
    if (title) {
      this.newChat(title);
    }
  }

  newChat(title: string) {
    const chat: Chat = { title, messages: [], images: [] };
    this.chats.push(chat);
    this.currentChat = chat;
    this.filteredChats = this.chats;
    this.scrollToBottom(); // Faire défiler jusqu'au bas après avoir créé un nouveau chat
  }

  setCurrentChat(chat: Chat) {
    this.currentChat = chat;
    this.scrollToBottom(); // Faire défiler jusqu'au bas lors de la sélection d'une conversation
  }

  sendDefaultPrompt(title: string, content: string) {
    this.newChat(title);
    this.sendMessage(content, 'user');
    this.scrollToBottom(); // Faire défiler jusqu'au bas après avoir reçu une réponse
  }

  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
  }

  deleteChat(chat: Chat) {
    this.chats = this.chats.filter(c => c !== chat);
    this.filteredChats = this.chats;
    if (this.currentChat === chat) {
      this.currentChat = undefined;
    }
  }

  filterChats(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredChats = this.chats.filter(chat => chat.title.toLowerCase().includes(query));
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll to bottom error:', err);
    }
  }

  private speakText(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
}
