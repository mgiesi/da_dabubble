import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class MockDataService {
    getMockChannels() {
        return [
            { id: '1', name: 'Allgemein', description: 'Allgemeine Diskussionen', createdBy: 'dev-user', createdAt: new Date() },
            { id: '2', name: 'Entwicklung', description: 'Frontend & Backend Entwicklung', createdBy: 'dev-user', createdAt: new Date() },
            { id: '3', name: 'Design', description: 'UI/UX Design', createdBy: 'dev-user', createdAt: new Date() }
        ];
    }

    getMockUsers() {
        return [
            { id: '1', uid: 'dev-user', email: 'noah@test.de', displayName: 'Noah Braun', imgUrl: '/assets/avatars/noah.jpg' },
            { id: '2', uid: 'dev-user-2', email: 'anna@test.de', displayName: 'Anna Schmidt', imgUrl: '/assets/avatars/anna.jpg' }
        ];
    }

    // mock-data.service.ts
    getMockMessages() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const today = new Date();

        return [
            {
                id: '1',
                channelId: 'ctwbp4Ku6JdPmmU3cp17',
                userId: '1',
                user: 'Noah Braun',
                time: '16:30',
                content: 'Welche Version ist aktuell von Angular?',
                avatar: '/img/avatar/noah-braun.png',
                createdAt: yesterday,
                isOwnMessage: false
            },
            {
                id: '2',
                channelId: 'ctwbp4Ku6JdPmmU3cp17',
                userId: '2',
                user: 'Sofia Müller',
                time: '14:25',
                content: 'Angular 19 ist die aktuelle Version!',
                avatar: '/img/avatar/sofia-müller.png',
                createdAt: today,
                isOwnMessage: false
            },
            {
                id: '3',
                channelId: 'ctwbp4Ku6JdPmmU3cp17',
                userId: 'current-user',
                user: 'Frederik Beck',
                time: '15:06',
                content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque blandit odio efficitur lectus vestibulum.',
                avatar: '/img/avatar/frederik-beck.png',
                createdAt: today,
                isOwnMessage: true
            }
        ];
    }

    getThreadMessages(originalMessageId: string) {
        return [
            {
                id: 'thread-1',
                channelId: 'ctwbp4Ku6JdPmmU3cp17',
                userId: '2',
                user: 'Sofia Müller',
                time: '14:30',
                content: 'Ich habe die gleiche Frage. Ich habe gegoogelt und es scheint, dass die aktuelle Version Angular 13 ist. Vielleicht weiß Frederik, ob es wahr ist.',
                avatar: '/img/avatar/sofia-müller.png',
                isOwnMessage: false,
                reactions: [{ emoji: '👍', count: 1 }]
            },
            {
                id: 'thread-2',
                channelId: 'ctwbp4Ku6JdPmmU3cp17',
                userId: 'current-user',
                user: 'Frederik Beck',
                time: '15:06',
                content: 'Ja das ist es.',
                avatar: '/img/avatar/frederik-beck.png',
                isOwnMessage: true,
                reactions: [{ emoji: '👍', count: 1 }]
            }
        ];
    }
}